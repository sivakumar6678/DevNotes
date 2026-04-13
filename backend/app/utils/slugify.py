import re


_non_alnum = re.compile(r"[^a-z0-9]+")
_trim_hyphens = re.compile(r"(^-+)|(-+$)")


def slugify(value: str) -> str:
    if not isinstance(value, str):
        value = str(value)
    value = value.strip().lower()
    value = _non_alnum.sub("-", value)
    value = _trim_hyphens.sub("", value)
    return value or "untitled"

