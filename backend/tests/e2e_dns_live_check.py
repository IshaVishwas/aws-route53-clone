import urllib.request
import json
import time

time.sleep(1)
base = "http://127.0.0.1:8000/api/v1"

def request_json(url, method="GET", data=None, token=None):
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, method=method)
    if data is not None:
        req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as res:
            status = res.status
            content = res.read().decode("utf-8")
            return status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        return e.code, json.loads(content) if content else {}

# 1. Login
status, auth = request_json(f"{base}/auth/login", method="POST", data={"email": "admin@route53.aws", "password": "AdminPassword123!"})
assert status == 200, f"Login failed: {auth}"
token = auth["token"]
print("1. [PASS] Live auth login succeeded for:", auth["user"]["email"])

# 2. Create a test Hosted Zone
zone_payload = {
    "name": "live-test-zone.net",
    "type": "PUBLIC",
    "comment": "Live E2E test zone",
}
status, zone = request_json(f"{base}/hosted-zones", method="POST", data=zone_payload, token=token)
assert status == 201, f"Create zone failed: {zone}"
zone_id = zone["id"]
print(f"2. [PASS] Created Hosted Zone: {zone['name']} ({zone['zone_id']})")

# 3. Create Multiple Record Types (A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA)
record_definitions = [
    {"name": "www.live-test-zone.net", "type": "A", "ttl": 300, "value": "198.51.100.1"},
    {"name": "ipv6.live-test-zone.net", "type": "AAAA", "ttl": 300, "value": "2001:db8::10"},
    {"name": "blog.live-test-zone.net", "type": "CNAME", "ttl": 600, "value": "cdn.live-test-zone.net."},
    {"name": "live-test-zone.net", "type": "TXT", "ttl": 300, "value": "google-site-verification=abcdef123"},
    {"name": "live-test-zone.net", "type": "MX", "ttl": 300, "value": "mail.live-test-zone.net.", "priority": 10},
    {"name": "sub.live-test-zone.net", "type": "NS", "ttl": 172800, "value": "ns1.awsdns.com."},
    {"name": "1.100.51.198.in-addr.arpa", "type": "PTR", "ttl": 300, "value": "www.live-test-zone.net."},
    {"name": "_sip._tcp.live-test-zone.net", "type": "SRV", "ttl": 300, "value": "0 5060 sip.live-test-zone.net.", "priority": 20},
    {"name": "live-test-zone.net", "type": "CAA", "ttl": 300, "value": "0 issue \"letsencrypt.org\""},
]

created_records = []
for rdef in record_definitions:
    status, rec = request_json(f"{base}/hosted-zones/{zone_id}/records", method="POST", data=rdef, token=token)
    assert status == 201, f"Create record {rdef['type']} failed: {rec}"
    created_records.append(rec)
    print(f"   + [PASS] Created {rec['type']} record: {rec['name']} -> {rec['value']}")

print(f"3. [PASS] Successfully created all {len(created_records)} record types.")

# 4. List records and verify count
status, rlist = request_json(f"{base}/hosted-zones/{zone_id}/records", token=token)
assert status == 200, f"List records failed: {rlist}"
assert rlist["total"] == len(record_definitions), f"Expected {len(record_definitions)}, got {rlist['total']}"
print(f"4. [PASS] Verified total record count in zone: {rlist['total']}")

# 5. Verify live record_count in HostedZone API
status, zone_detail = request_json(f"{base}/hosted-zones/{zone_id}", token=token)
assert status == 200
assert zone_detail["record_count"] == len(record_definitions), f"Expected record_count {len(record_definitions)}, got {zone_detail['record_count']}"
print(f"5. [PASS] Verified live record_count in HostedZone metadata: {zone_detail['record_count']}")

# 6. Search records by name and value
status, s_name = request_json(f"{base}/hosted-zones/{zone_id}/records?search=blog", token=token)
assert status == 200
assert len(s_name["items"]) == 1 and s_name["items"][0]["type"] == "CNAME"
print("6. [PASS] Search by name keyword ('blog') returned matching CNAME record.")

status, s_val = request_json(f"{base}/hosted-zones/{zone_id}/records?search=198.51.100.1", token=token)
assert status == 200
assert len(s_val["items"]) == 1 and s_val["items"][0]["type"] == "A"
print("   + [PASS] Search by value keyword ('198.51.100.1') returned matching A record.")

# 7. Filter records by type
status, f_mx = request_json(f"{base}/hosted-zones/{zone_id}/records?type=MX", token=token)
assert status == 200
assert len(f_mx["items"]) == 1 and f_mx["items"][0]["type"] == "MX"
print("7. [PASS] Filter by type=MX returned 1 item with Priority:", f_mx["items"][0]["priority"])

# 8. Update record
target_rec = created_records[0] # A record
status, u_rec = request_json(f"{base}/records/{target_rec['id']}", method="PUT", data={"ttl": 900, "value": "198.51.100.99"}, token=token)
assert status == 200
assert u_rec["ttl"] == 900 and u_rec["value"] == "198.51.100.99"
print(f"8. [PASS] Successfully updated A record: new TTL={u_rec['ttl']}, value={u_rec['value']}")

# 9. Get record by ID
status, g_rec = request_json(f"{base}/records/{target_rec['id']}", token=token)
assert status == 200
assert g_rec["value"] == "198.51.100.99"
print("9. [PASS] Successfully retrieved updated record by ID.")

# 10. Delete a record and verify deletion
del_rec = created_records[1] # AAAA record
status, _ = request_json(f"{base}/records/{del_rec['id']}", method="DELETE", token=token)
assert status == 204
print(f"10. [PASS] Deleted AAAA record ({del_rec['id']}).")

# Verify 404
status, not_found = request_json(f"{base}/records/{del_rec['id']}", token=token)
assert status == 404
print("    + [PASS] Verified GET on deleted record returns 404 Not Found.")

# 11. Clean up test Hosted Zone (cascades to all remaining records)
status, _ = request_json(f"{base}/hosted-zones/{zone_id}", method="DELETE", token=token)
assert status == 204
print(f"11. [PASS] Deleted test hosted zone ({zone_id}), cascaded delete of all records.")

# Verify zone 404
status, _ = request_json(f"{base}/hosted-zones/{zone_id}", token=token)
assert status == 404
print("    + [PASS] Verified GET on deleted zone returns 404 Not Found.")

print("\n==============================================")
print("ALL LIVE E2E DNS WORKFLOW TESTS PASSED 100%!")
print("==============================================")
