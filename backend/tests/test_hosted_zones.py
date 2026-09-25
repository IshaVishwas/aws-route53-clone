import os
import sys
import unittest
from fastapi.testclient import TestClient

# Ensure backend root is on Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.core.database import SessionLocal
from app.models.hosted_zone import HostedZone
from app.models.auth import User, Session


class TestHostedZones(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

        # Login to obtain a valid session token for authenticated calls
        login_res = cls.client.post(
            "/api/v1/auth/login",
            json={
                "email": "admin@route53.aws",
                "password": "AdminPassword123!",
            },
        )
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        data = login_res.json()
        cls.token = data["token"]
        cls.auth_headers = {"Authorization": f"Bearer {cls.token}"}

    def setUp(self):
        # Clean up any test-created hosted zones before each test to keep tests isolated
        db = SessionLocal()
        try:
            db.query(HostedZone).filter(HostedZone.name.like("%test-%")).delete(synchronize_session=False)
            db.commit()
        finally:
            db.close()

    def tearDown(self):
        # Clean up test zones after each test
        db = SessionLocal()
        try:
            db.query(HostedZone).filter(HostedZone.name.like("%test-%")).delete(synchronize_session=False)
            db.commit()
        finally:
            db.close()

    # 1. Unauthorized access
    def test_01_unauthorized_access(self):
        res = self.client.get("/api/v1/hosted-zones")
        self.assertEqual(res.status_code, 401)
        self.assertIn("detail", res.json())

        res2 = self.client.post("/api/v1/hosted-zones", json={"name": "test-example.com"})
        self.assertEqual(res2.status_code, 401)

    # 2. Authenticated list request
    def test_02_authenticated_list_empty_or_items(self):
        res = self.client.get("/api/v1/hosted-zones", headers=self.auth_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("items", data)
        self.assertIn("total", data)
        self.assertIn("page", data)
        self.assertIn("page_size", data)
        self.assertIn("total_pages", data)
        self.assertIsInstance(data["items"], list)

    # 3. Create Hosted Zone (Public and Private)
    def test_03_create_hosted_zone(self):
        payload = {
            "name": "test-prod.example.com",
            "type": "PUBLIC",
            "comment": "Test production zone",
        }
        res = self.client.post("/api/v1/hosted-zones", json=payload, headers=self.auth_headers)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["name"], "test-prod.example.com.")
        self.assertEqual(data["type"], "PUBLIC")
        self.assertFalse(data["private_zone"])
        self.assertEqual(data["comment"], "Test production zone")
        self.assertTrue(data["zone_id"].startswith("Z"))
        self.assertEqual(data["record_count"], 0)
        self.assertIsNotNone(data["id"])

        # Test Private Zone
        priv_payload = {
            "name": "test-internal.local",
            "type": "PRIVATE",
            "comment": "Internal VPC zone",
        }
        res_priv = self.client.post("/api/v1/hosted-zones", json=priv_payload, headers=self.auth_headers)
        self.assertEqual(res_priv.status_code, 201)
        data_priv = res_priv.json()
        self.assertEqual(data_priv["type"], "PRIVATE")
        self.assertTrue(data_priv["private_zone"])

    # 4. Get Hosted Zone by UUID and AWS zone_id
    def test_04_get_hosted_zone(self):
        create_res = self.client.post(
            "/api/v1/hosted-zones",
            json={"name": "test-lookup.com", "comment": "Lookup test"},
            headers=self.auth_headers,
        )
        self.assertEqual(create_res.status_code, 201)
        zone = create_res.json()

        # Lookup by UUID id
        res_by_id = self.client.get(f"/api/v1/hosted-zones/{zone['id']}", headers=self.auth_headers)
        self.assertEqual(res_by_id.status_code, 200)
        self.assertEqual(res_by_id.json()["name"], "test-lookup.com.")

        # Lookup by zone_id
        res_by_zid = self.client.get(f"/api/v1/hosted-zones/{zone['zone_id']}", headers=self.auth_headers)
        self.assertEqual(res_by_zid.status_code, 200)
        self.assertEqual(res_by_zid.json()["id"], zone["id"])

    # 5. Update Hosted Zone
    def test_05_update_hosted_zone(self):
        create_res = self.client.post(
            "/api/v1/hosted-zones",
            json={"name": "test-update.com", "comment": "Initial comment"},
            headers=self.auth_headers,
        )
        self.assertEqual(create_res.status_code, 201)
        zone_id = create_res.json()["zone_id"]

        update_res = self.client.put(
            f"/api/v1/hosted-zones/{zone_id}",
            json={"comment": "Updated new comment"},
            headers=self.auth_headers,
        )
        self.assertEqual(update_res.status_code, 200)
        updated = update_res.json()
        self.assertEqual(updated["comment"], "Updated new comment")

    # 6. Delete Hosted Zone
    def test_06_delete_hosted_zone(self):
        create_res = self.client.post(
            "/api/v1/hosted-zones",
            json={"name": "test-delete.com"},
            headers=self.auth_headers,
        )
        self.assertEqual(create_res.status_code, 201)
        zid = create_res.json()["zone_id"]

        del_res = self.client.delete(f"/api/v1/hosted-zones/{zid}", headers=self.auth_headers)
        self.assertEqual(del_res.status_code, 204)

        # Subsequent GET should return 404
        get_res = self.client.get(f"/api/v1/hosted-zones/{zid}", headers=self.auth_headers)
        self.assertEqual(get_res.status_code, 404)

    # 7. Search by zone name
    def test_07_search_hosted_zones(self):
        self.client.post(
            "/api/v1/hosted-zones",
            json={"name": "test-alpha-search.com"},
            headers=self.auth_headers,
        )
        self.client.post(
            "/api/v1/hosted-zones",
            json={"name": "test-beta-search.com"},
            headers=self.auth_headers,
        )

        res = self.client.get(
            "/api/v1/hosted-zones?search=alpha-search",
            headers=self.auth_headers,
        )
        self.assertEqual(res.status_code, 200)
        items = res.json()["items"]
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["name"], "test-alpha-search.com.")

    # 8. Public / Private filter
    def test_08_type_filter(self):
        self.client.post(
            "/api/v1/hosted-zones",
            json={"name": "test-public-filter.com", "type": "PUBLIC"},
            headers=self.auth_headers,
        )
        self.client.post(
            "/api/v1/hosted-zones",
            json={"name": "test-private-filter.internal", "type": "PRIVATE"},
            headers=self.auth_headers,
        )

        res_pub = self.client.get(
            "/api/v1/hosted-zones?type=PUBLIC&search=test-",
            headers=self.auth_headers,
        )
        self.assertEqual(res_pub.status_code, 200)
        for z in res_pub.json()["items"]:
            self.assertEqual(z["type"], "PUBLIC")

        res_priv = self.client.get(
            "/api/v1/hosted-zones?type=PRIVATE&search=test-",
            headers=self.auth_headers,
        )
        self.assertEqual(res_priv.status_code, 200)
        for z in res_priv.json()["items"]:
            self.assertEqual(z["type"], "PRIVATE")

    # 9. Pagination
    def test_09_pagination(self):
        for i in range(5):
            self.client.post(
                "/api/v1/hosted-zones",
                json={"name": f"test-page-{i}.com"},
                headers=self.auth_headers,
            )

        res = self.client.get(
            "/api/v1/hosted-zones?search=test-page-&page=1&page_size=2",
            headers=self.auth_headers,
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data["items"]), 2)
        self.assertEqual(data["total"], 5)
        self.assertEqual(data["page"], 1)
        self.assertEqual(data["page_size"], 2)
        self.assertEqual(data["total_pages"], 3)

        # Page 3 should have 1 item
        res3 = self.client.get(
            "/api/v1/hosted-zones?search=test-page-&page=3&page_size=2",
            headers=self.auth_headers,
        )
        self.assertEqual(res3.status_code, 200)
        self.assertEqual(len(res3.json()["items"]), 1)

    # 10. Nonexistent zone lookup, update, and delete
    def test_10_nonexistent_zone(self):
        fake_id = "ZNONEXISTENT999"
        res_get = self.client.get(f"/api/v1/hosted-zones/{fake_id}", headers=self.auth_headers)
        self.assertEqual(res_get.status_code, 404)

        res_put = self.client.put(
            f"/api/v1/hosted-zones/{fake_id}",
            json={"comment": "Won't work"},
            headers=self.auth_headers,
        )
        self.assertEqual(res_put.status_code, 404)

        res_del = self.client.delete(f"/api/v1/hosted-zones/{fake_id}", headers=self.auth_headers)
        self.assertEqual(res_del.status_code, 404)

    # 11. Input validation & duplicate domain prevention
    def test_11_invalid_and_duplicate_input(self):
        # Invalid domain name format
        res_invalid = self.client.post(
            "/api/v1/hosted-zones",
            json={"name": "not a domain!!"},
            headers=self.auth_headers,
        )
        self.assertEqual(res_invalid.status_code, 422)

        # Create first valid zone
        res_orig = self.client.post(
            "/api/v1/hosted-zones",
            json={"name": "test-duplicate.com"},
            headers=self.auth_headers,
        )
        self.assertEqual(res_orig.status_code, 201)

        # Duplicate creation attempt should return 409 Conflict
        res_dup = self.client.post(
            "/api/v1/hosted-zones",
            json={"name": "test-duplicate.com"},
            headers=self.auth_headers,
        )
        self.assertEqual(res_dup.status_code, 409)
        self.assertIn("already exists", res_dup.json()["detail"])


if __name__ == "__main__":
    unittest.main()
