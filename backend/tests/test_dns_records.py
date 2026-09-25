import os
import sys
import unittest
from fastapi.testclient import TestClient

# Ensure backend root is on Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.core.database import SessionLocal
from app.models.hosted_zone import HostedZone
from app.models.dns_record import DNSRecord


class TestDNSRecords(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

        # Obtain valid authentication token
        login_res = cls.client.post(
            "/api/v1/auth/login",
            json={
                "email": "admin@route53.aws",
                "password": "AdminPassword123!",
            },
        )
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        cls.token = login_res.json()["token"]
        cls.auth_headers = {"Authorization": f"Bearer {cls.token}"}

        # Create primary test hosted zone
        create_zone_res = cls.client.post(
            "/api/v1/hosted-zones",
            json={
                "name": "dns-test-primary.com",
                "type": "PUBLIC",
                "comment": "Primary zone for DNS record testing",
            },
            headers=cls.auth_headers,
        )
        assert create_zone_res.status_code == 201, f"Zone create failed: {create_zone_res.text}"
        cls.zone = create_zone_res.json()
        cls.zone_id = cls.zone["id"]
        cls.zone_aws_id = cls.zone["zone_id"]

        # Create secondary test hosted zone for isolation tests
        create_sec_res = cls.client.post(
            "/api/v1/hosted-zones",
            json={
                "name": "dns-test-secondary.com",
                "type": "PUBLIC",
                "comment": "Secondary zone for isolation testing",
            },
            headers=cls.auth_headers,
        )
        assert create_sec_res.status_code == 201
        cls.sec_zone = create_sec_res.json()

    @classmethod
    def tearDownClass(cls):
        # Clean up created test zones (cascades to records)
        db = SessionLocal()
        try:
            db.query(HostedZone).filter(HostedZone.name.like("%dns-test-%")).delete(synchronize_session=False)
            db.commit()
        finally:
            db.close()

    def setUp(self):
        # Clean up records for test zones before each test
        db = SessionLocal()
        try:
            db.query(DNSRecord).filter(
                DNSRecord.hosted_zone_id.in_([self.zone["id"], self.sec_zone["id"]])
            ).delete(synchronize_session=False)
            db.commit()
        finally:
            db.close()

    # 1. Unauthorized record access
    def test_01_unauthorized_access(self):
        res = self.client.get(f"/api/v1/hosted-zones/{self.zone_id}/records")
        self.assertEqual(res.status_code, 401)

        res2 = self.client.post(
            f"/api/v1/hosted-zones/{self.zone_id}/records",
            json={"name": "test.com", "type": "A", "value": "1.2.3.4"},
        )
        self.assertEqual(res2.status_code, 401)

        res3 = self.client.get("/api/v1/records/nonexistent-id")
        self.assertEqual(res3.status_code, 401)

    # 2. List records (initially empty)
    def test_02_list_records_empty(self):
        res = self.client.get(
            f"/api/v1/hosted-zones/{self.zone_id}/records",
            headers=self.auth_headers,
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["total"], 0)
        self.assertEqual(len(data["items"]), 0)
        self.assertEqual(data["page"], 1)

    # 3. Create A record
    def test_03_create_a_record(self):
        res = self.client.post(
            f"/api/v1/hosted-zones/{self.zone_id}/records",
            json={"name": "www.dns-test-primary.com", "type": "A", "ttl": 300, "value": "192.0.2.1"},
            headers=self.auth_headers,
        )
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["type"], "A")
        self.assertEqual(data["value"], "192.0.2.1")
        self.assertEqual(data["name"], "www.dns-test-primary.com.")
        self.assertEqual(data["ttl"], 300)
        self.assertEqual(data["hosted_zone_id"], self.zone_id)

    # 4. Create AAAA record
    def test_04_create_aaaa_record(self):
        res = self.client.post(
            f"/api/v1/hosted-zones/{self.zone_id}/records",
            json={"name": "ipv6.dns-test-primary.com", "type": "AAAA", "ttl": 60, "value": "2001:db8::1"},
            headers=self.auth_headers,
        )
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["type"], "AAAA")
        self.assertEqual(data["value"], "2001:db8::1")

    # 5. Create CNAME record
    def test_05_create_cname_record(self):
        res = self.client.post(
            f"/api/v1/hosted-zones/{self.zone_id}/records",
            json={"name": "blog.dns-test-primary.com", "type": "CNAME", "ttl": 3600, "value": "lb.dns-test-primary.com."},
            headers=self.auth_headers,
        )
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["type"], "CNAME")
        self.assertEqual(data["value"], "lb.dns-test-primary.com.")

    # 6. Create TXT record
    def test_06_create_txt_record(self):
        res = self.client.post(
            f"/api/v1/hosted-zones/{self.zone_id}/records",
            json={"name": "dns-test-primary.com", "type": "TXT", "ttl": 300, "value": "v=spf1 include:_spf.google.com ~all"},
            headers=self.auth_headers,
        )
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["type"], "TXT")
        self.assertEqual(data["value"], "v=spf1 include:_spf.google.com ~all")

    # 7. Create MX record
    def test_07_create_mx_record(self):
        res = self.client.post(
            f"/api/v1/hosted-zones/{self.zone_id}/records",
            json={"name": "dns-test-primary.com", "type": "MX", "ttl": 300, "value": "mail.dns-test-primary.com.", "priority": 10},
            headers=self.auth_headers,
        )
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["type"], "MX")
        self.assertEqual(data["priority"], 10)
        self.assertEqual(data["value"], "mail.dns-test-primary.com.")

    # 8. Create NS record
    def test_08_create_ns_record(self):
        res = self.client.post(
            f"/api/v1/hosted-zones/{self.zone_id}/records",
            json={"name": "sub.dns-test-primary.com", "type": "NS", "ttl": 172800, "value": "ns-1.awsdns.org."},
            headers=self.auth_headers,
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.json()["type"], "NS")

    # 9. Create PTR record
    def test_09_create_ptr_record(self):
        res = self.client.post(
            f"/api/v1/hosted-zones/{self.zone_id}/records",
            json={"name": "1.2.0.192.in-addr.arpa", "type": "PTR", "ttl": 300, "value": "host.dns-test-primary.com."},
            headers=self.auth_headers,
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.json()["type"], "PTR")

    # 10. Create SRV record
    def test_10_create_srv_record(self):
        res = self.client.post(
            f"/api/v1/hosted-zones/{self.zone_id}/records",
            json={"name": "_sip._tcp.dns-test-primary.com", "type": "SRV", "ttl": 300, "value": "0 5060 sipserver.example.com.", "priority": 20},
            headers=self.auth_headers,
        )
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["type"], "SRV")
        self.assertEqual(data["priority"], 20)

    # 11. Create CAA record
    def test_11_create_caa_record(self):
        res = self.client.post(
            f"/api/v1/hosted-zones/{self.zone_id}/records",
            json={"name": "dns-test-primary.com", "type": "CAA", "ttl": 300, "value": '0 issue "amazon.com"'},
            headers=self.auth_headers,
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.json()["type"], "CAA")

    # 12. Get single record by ID
    def test_12_get_record(self):
        c_res = self.client.post(
            f"/api/v1/hosted-zones/{self.zone_id}/records",
            json={"name": "get-test.com", "type": "A", "ttl": 300, "value": "10.0.0.1"},
            headers=self.auth_headers,
        )
        rec_id = c_res.json()["id"]

        get_res = self.client.get(f"/api/v1/records/{rec_id}", headers=self.auth_headers)
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.json()["id"], rec_id)
        self.assertEqual(get_res.json()["value"], "10.0.0.1")

    # 13. Update record
    def test_13_update_record(self):
        c_res = self.client.post(
            f"/api/v1/hosted-zones/{self.zone_id}/records",
            json={"name": "update-test.com", "type": "A", "ttl": 300, "value": "10.0.0.1"},
            headers=self.auth_headers,
        )
        rec_id = c_res.json()["id"]

        u_res = self.client.put(
            f"/api/v1/records/{rec_id}",
            json={"ttl": 600, "value": "10.0.0.2"},
            headers=self.auth_headers,
        )
        self.assertEqual(u_res.status_code, 200)
        self.assertEqual(u_res.json()["ttl"], 600)
        self.assertEqual(u_res.json()["value"], "10.0.0.2")

    # 14. Delete record
    def test_14_delete_record(self):
        c_res = self.client.post(
            f"/api/v1/hosted-zones/{self.zone_id}/records",
            json={"name": "delete-test.com", "type": "A", "ttl": 300, "value": "10.0.0.1"},
            headers=self.auth_headers,
        )
        rec_id = c_res.json()["id"]

        d_res = self.client.delete(f"/api/v1/records/{rec_id}", headers=self.auth_headers)
        self.assertEqual(d_res.status_code, 204)

        # GET should now return 404
        g_res = self.client.get(f"/api/v1/records/{rec_id}", headers=self.auth_headers)
        self.assertEqual(g_res.status_code, 404)

    # 15. Search records by name and value
    def test_15_search_records(self):
        self.client.post(
            f"/api/v1/hosted-zones/{self.zone_id}/records",
            json={"name": "api.search-alpha.com", "type": "A", "value": "192.168.1.50"},
            headers=self.auth_headers,
        )
        self.client.post(
            f"/api/v1/hosted-zones/{self.zone_id}/records",
            json={"name": "db.search-beta.com", "type": "A", "value": "192.168.1.99"},
            headers=self.auth_headers,
        )

        # Search by name keyword
        s_name = self.client.get(
            f"/api/v1/hosted-zones/{self.zone_id}/records?search=search-alpha",
            headers=self.auth_headers,
        )
        self.assertEqual(s_name.status_code, 200)
        self.assertEqual(len(s_name.json()["items"]), 1)
        self.assertEqual(s_name.json()["items"][0]["name"], "api.search-alpha.com.")

        # Search by value keyword
        s_val = self.client.get(
            f"/api/v1/hosted-zones/{self.zone_id}/records?search=1.99",
            headers=self.auth_headers,
        )
        self.assertEqual(s_val.status_code, 200)
        self.assertEqual(len(s_val.json()["items"]), 1)
        self.assertEqual(s_val.json()["items"][0]["name"], "db.search-beta.com.")

    # 16. Type filter
    def test_16_type_filter(self):
        self.client.post(
            f"/api/v1/hosted-zones/{self.zone_id}/records",
            json={"name": "filter1.com", "type": "A", "value": "1.1.1.1"},
            headers=self.auth_headers,
        )
        self.client.post(
            f"/api/v1/hosted-zones/{self.zone_id}/records",
            json={"name": "filter2.com", "type": "TXT", "value": "sample"},
            headers=self.auth_headers,
        )

        res_a = self.client.get(
            f"/api/v1/hosted-zones/{self.zone_id}/records?type=A",
            headers=self.auth_headers,
        )
        self.assertEqual(res_a.status_code, 200)
        for r in res_a.json()["items"]:
            self.assertEqual(r["type"], "A")

        res_txt = self.client.get(
            f"/api/v1/hosted-zones/{self.zone_id}/records?type=TXT",
            headers=self.auth_headers,
        )
        self.assertEqual(res_txt.status_code, 200)
        for r in res_txt.json()["items"]:
            self.assertEqual(r["type"], "TXT")

    # 17. Pagination
    def test_17_pagination(self):
        for i in range(5):
            self.client.post(
                f"/api/v1/hosted-zones/{self.zone_id}/records",
                json={"name": f"page-{i}.com", "type": "A", "value": f"10.0.0.{i+1}"},
                headers=self.auth_headers,
            )

        res = self.client.get(
            f"/api/v1/hosted-zones/{self.zone_id}/records?page=1&page_size=2",
            headers=self.auth_headers,
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["total"], 5)
        self.assertEqual(len(data["items"]), 2)
        self.assertEqual(data["total_pages"], 3)

    # 18. Nonexistent hosted zone
    def test_18_nonexistent_hosted_zone(self):
        res = self.client.get(
            "/api/v1/hosted-zones/nonexistent-zone-id/records",
            headers=self.auth_headers,
        )
        self.assertEqual(res.status_code, 404)

        res2 = self.client.post(
            "/api/v1/hosted-zones/nonexistent-zone-id/records",
            json={"name": "test.com", "type": "A", "value": "1.1.1.1"},
            headers=self.auth_headers,
        )
        self.assertEqual(res2.status_code, 404)

    # 19. Nonexistent record
    def test_19_nonexistent_record(self):
        fake_id = "nonexistent-record-uuid"
        res_get = self.client.get(f"/api/v1/records/{fake_id}", headers=self.auth_headers)
        self.assertEqual(res_get.status_code, 404)

        res_put = self.client.put(f"/api/v1/records/{fake_id}", json={"ttl": 60}, headers=self.auth_headers)
        self.assertEqual(res_put.status_code, 404)

        res_del = self.client.delete(f"/api/v1/records/{fake_id}", headers=self.auth_headers)
        self.assertEqual(res_del.status_code, 404)

    # 20. Invalid record type
    def test_20_invalid_record_type(self):
        res = self.client.post(
            f"/api/v1/hosted-zones/{self.zone_id}/records",
            json={"name": "bad.com", "type": "INVALID_TYPE", "value": "1.1.1.1"},
            headers=self.auth_headers,
        )
        self.assertEqual(res.status_code, 422)

    # 21. Invalid input validation (e.g. malformed IPv4)
    def test_21_invalid_input(self):
        res = self.client.post(
            f"/api/v1/hosted-zones/{self.zone_id}/records",
            json={"name": "bad-ip.com", "type": "A", "value": "not-an-ip-address"},
            headers=self.auth_headers,
        )
        self.assertEqual(res.status_code, 422)

    # 22. Isolation between Hosted Zone A and Hosted Zone B
    def test_22_zone_isolation(self):
        # Create record in Zone A
        self.client.post(
            f"/api/v1/hosted-zones/{self.zone['id']}/records",
            json={"name": "zone-a.com", "type": "A", "value": "1.1.1.1"},
            headers=self.auth_headers,
        )
        # Create record in Zone B
        self.client.post(
            f"/api/v1/hosted-zones/{self.sec_zone['id']}/records",
            json={"name": "zone-b.com", "type": "A", "value": "2.2.2.2"},
            headers=self.auth_headers,
        )

        res_a = self.client.get(f"/api/v1/hosted-zones/{self.zone['id']}/records", headers=self.auth_headers)
        res_b = self.client.get(f"/api/v1/hosted-zones/{self.sec_zone['id']}/records", headers=self.auth_headers)

        names_a = [r["name"] for r in res_a.json()["items"]]
        names_b = [r["name"] for r in res_b.json()["items"]]

        self.assertIn("zone-a.com.", names_a)
        self.assertNotIn("zone-b.com.", names_a)

        self.assertIn("zone-b.com.", names_b)
        self.assertNotIn("zone-a.com.", names_b)


if __name__ == "__main__":
    unittest.main()
