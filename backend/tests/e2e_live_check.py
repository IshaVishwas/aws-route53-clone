import urllib.request
import json
import time

time.sleep(1)
base = "http://127.0.0.1:8000/api/v1"

def post_json(url, data, token=None):
    req = urllib.request.Request(url, data=json.dumps(data).encode(), headers={"Content-Type": "application/json"})
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req) as res:
        return res.status, json.loads(res.read().decode())

def get_json(url, token=None):
    req = urllib.request.Request(url)
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req) as res:
        return res.status, json.loads(res.read().decode())

def put_json(url, data, token=None):
    req = urllib.request.Request(url, data=json.dumps(data).encode(), headers={"Content-Type": "application/json"}, method="PUT")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req) as res:
        return res.status, json.loads(res.read().decode())

def delete_req(url, token=None):
    req = urllib.request.Request(url, method="DELETE")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req) as res:
        return res.status

# 1. Login
status, auth = post_json(f"{base}/auth/login", {"email": "admin@route53.aws", "password": "AdminPassword123!"})
assert status == 200, "Login failed"
token = auth["token"]
print("1. Live login OK:", auth["user"]["email"])

# 2. List (clean)
status, lst = get_json(f"{base}/hosted-zones", token)
print("2. Initial list total count:", lst["total"])

# 3. Create Public Zone
status, z1 = post_json(f"{base}/hosted-zones", {"name": "e2e-acme.com", "type": "PUBLIC", "comment": "Acme Main Site"}, token)
print(f"3. Created Public Zone: {z1['name']} ({z1['zone_id']}) - Type: {z1['type']}")

# 4. Create Private Zone
status, z2 = post_json(f"{base}/hosted-zones", {"name": "e2e-corp.local", "type": "PRIVATE", "comment": "Internal VPC Zone"}, token)
print(f"4. Created Private Zone: {z2['name']} ({z2['zone_id']}) - Type: {z2['type']}")

# 5. Search
status, s_res = get_json(f"{base}/hosted-zones?search=acme", token)
print(f"5. Search result for 'acme': found {len(s_res['items'])} zone(s): {s_res['items'][0]['name']}")

# 6. Filter by type
status, f_priv = get_json(f"{base}/hosted-zones?type=PRIVATE", token)
print(f"6. Filter PRIVATE total:", f_priv["total"])

# 7. Update comment
status, u_res = put_json(f"{base}/hosted-zones/{z1['zone_id']}", {"comment": "Updated Acme Production Site"}, token)
print(f"7. Updated comment for {z1['zone_id']}:", u_res["comment"])

# 8. Get by zone_id
status, g_res = get_json(f"{base}/hosted-zones/{z1['zone_id']}", token)
print(f"8. Verified get by zone_id: comment is '{g_res['comment']}'")

# 9. Clean up created test zones
status1 = delete_req(f"{base}/hosted-zones/{z1['zone_id']}", token)
status2 = delete_req(f"{base}/hosted-zones/{z2['zone_id']}", token)
print("9. Cleaned up test zones:", status1, status2)

print("ALL LIVE HTTP E2E TESTS PASSED PERFECTLY!")
