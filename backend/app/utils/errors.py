from dataclasses import dataclass


@dataclass
class APIError(Exception):
    message: str
    status_code: int = 400
    error_type: str = "bad_request"
    details: dict | None = None


class ValidationError(APIError):
    def __init__(self, message: str, *, details: dict | None = None):
        super().__init__(message=message, status_code=400, error_type="validation_error", details=details)


class NotFoundError(APIError):
    def __init__(self, message: str, *, details: dict | None = None):
        super().__init__(message=message, status_code=404, error_type="not_found", details=details)


class AuthenticationError(APIError):
    def __init__(self, message: str, *, details: dict | None = None):
        super().__init__(message=message, status_code=401, error_type="authentication_error", details=details)


class AuthorizationError(APIError):
    def __init__(self, message: str, *, details: dict | None = None):
        super().__init__(message=message, status_code=403, error_type="authorization_error", details=details)
