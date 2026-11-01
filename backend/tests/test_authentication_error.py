import ast
from pathlib import Path
import unittest
from types import SimpleNamespace

class HTTPException(Exception):
    def __init__(self, status_code, detail):
        self.status_code = status_code
        self.detail = detail

class AuthenticationErrorTests(unittest.TestCase):
    def test_only_explicit_credential_rejection_expires_session(self):
        tree = ast.parse((Path(__file__).parents[1] / 'app/main.py').read_text())
        function = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == 'authentication_error')
        env = {'HTTPException': HTTPException}
        exec(compile(ast.Module(body=[function], type_ignores=[]), '<auth>', 'exec'), env)
        for status in (400, 401, 403, '401'):
            self.assertEqual(env['authentication_error'](SimpleNamespace(status=status)).status_code, 401)
        for error in (TimeoutError(), ConnectionError(), SimpleNamespace(status=429), SimpleNamespace(status=500)):
            self.assertEqual(env['authentication_error'](error).status_code, 503)

if __name__ == '__main__':
    unittest.main()
