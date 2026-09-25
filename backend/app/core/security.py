import hashlib
import hmac
import secrets
from typing import Tuple


def hash_password(password: str, salt: str = None) -> str:
    """Hashes a password using PBKDF2 HMAC SHA-256 with a salt."""
    if not salt:
        salt = secrets.token_hex(16)
    
    pwd_bytes = password.encode("utf-8")
    salt_bytes = salt.encode("utf-8")
    
    key = hashlib.pbkdf2_hmac("sha256", pwd_bytes, salt_bytes, 100_000)
    return f"{salt}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the stored salt$hash string."""
    try:
        salt, key_hex = hashed_password.split("$", 1)
        expected_hash = hash_password(plain_password, salt=salt)
        return hmac.compare_digest(expected_hash, hashed_password)
    except Exception:
        return False


def generate_session_token() -> str:
    """Generates a secure cryptographically random session token string."""
    return secrets.token_urlsafe(48)
