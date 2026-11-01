"""Closing the legacy signup route must never create an auto-confirmed account."""
import ast
from pathlib import Path
import unittest
from unittest.mock import MagicMock

class HTTPException(Exception):
    def __init__(self, status_code, detail):
        self.status_code, self.detail = status_code, detail

class EmailSignupClosedTests(unittest.TestCase):
    def test_legacy_signup_rejects_without_database_or_admin_calls(self):
        tree = ast.parse((Path(__file__).parents[1] / 'app/main.py').read_text())
        node = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == 'live_auth_signup')
        node.decorator_list = []
        admin = MagicMock()
        scope = dict(AuthSignup=object, Any=object, HTTPException=HTTPException, supabase_admin=admin)
        exec(compile(ast.Module(body=[node], type_ignores=[]), '<signup>', 'exec'), scope)
        with self.assertRaises(HTTPException) as raised:
            scope['live_auth_signup'](object())
        self.assertEqual(raised.exception.status_code, 403)
        self.assertIn('카카오나 구글', raised.exception.detail)
        self.assertEqual(admin.mock_calls, [])
