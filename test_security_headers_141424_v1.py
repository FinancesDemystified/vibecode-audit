#!/usr/bin/env python3
"""
Security Header Validation Test
Date: 2024-12-14
Test: Verify security headers on vibecodeaudit.app
"""
import requests
import sys

def test_security_headers():
    """Test all required security headers are present"""
    url = "https://vibecodeaudit.app"
    
    try:
        response = requests.get(url, timeout=10)
        headers = response.headers
        
        print(f"Testing {url}\n")
        
        required_headers = {
            'Content-Security-Policy': 'CSP protection',
            'X-Frame-Options': 'Clickjacking protection',
            'X-Content-Type-Options': 'MIME sniffing protection',
            'X-XSS-Protection': 'XSS protection',
            'Referrer-Policy': 'Referrer policy'
        }
        
        missing = []
        present = []
        
        for header, description in required_headers.items():
            if header in headers:
                present.append(f"✓ {header}: {description}")
                print(f"✓ {header}: {headers[header][:80]}")
            else:
                missing.append(f"✗ {header}: {description}")
                print(f"✗ MISSING: {header} ({description})")
        
        # Check X-Powered-By is removed
        if 'X-Powered-By' not in headers:
            present.append("✓ X-Powered-By removed (server signature hidden)")
            print("\n✓ X-Powered-By header removed (good)")
        else:
            missing.append("✗ X-Powered-By still present")
            print(f"\n✗ X-Powered-By: {headers['X-Powered-By']} (should be removed)")
        
        print(f"\n{'='*60}")
        print(f"PASSED: {len(present)}/{len(required_headers)+1}")
        print(f"FAILED: {len(missing)}/{len(required_headers)+1}")
        
        return len(missing) == 0
        
    except Exception as e:
        print(f"Error testing {url}: {e}")
        return False

if __name__ == '__main__':
    success = test_security_headers()
    sys.exit(0 if success else 1)
