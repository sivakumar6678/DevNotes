from __future__ import annotations

from app.utils.errors import ValidationError


STRING_FIELDS = (
    "definition",
    "problem_it_solves",
    "detailed_explanation",
    "how_it_works",
)

LIST_OF_STRINGS_FIELDS = (
    "common_mistakes",
    "best_practices",
)

STRUCTURED_LIST_FIELDS = (
    "syntax",
    "code_example",
    "practical_example",
    "interview_notes",
)

REQUIRED_KEYS = (
    *STRING_FIELDS,
    "core_concepts",
    *STRUCTURED_LIST_FIELDS,
    *LIST_OF_STRINGS_FIELDS,
)


def _validate_non_empty_string(value, *, path: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValidationError(f"`{path}` must be a non-empty string.")
    return value


def _is_list_of_strings(value) -> bool:
    return isinstance(value, list) and all(isinstance(item, str) for item in value)


class BaseObjectSchema:
    fields: tuple[str, ...] = ()

    @classmethod
    def load(cls, value, *, path: str) -> dict:
        if not isinstance(value, dict):
            raise ValidationError(f"`{path}` must be an object.")

        missing = [field for field in cls.fields if field not in value]
        if missing:
            raise ValidationError(f"`{path}` is missing required fields.", details={"missing": missing})

        return {
            field: _validate_non_empty_string(value.get(field), path=f"{path}.{field}")
            for field in cls.fields
        }


class CoreConceptSchema(BaseObjectSchema):
    fields = ("name", "explanation")


class SyntaxSchema(BaseObjectSchema):
    fields = ("title", "language", "code")


class CodeExampleSchema(BaseObjectSchema):
    fields = ("title", "language", "code")


class PracticalExampleSchema(BaseObjectSchema):
    fields = ("title", "description", "code", "explanation")


class RealWorldExampleSchema(BaseObjectSchema):
    fields = ("title", "description")


class InterviewSchema(BaseObjectSchema):
    fields = ("question", "answer")


class NoteContentSchema:
    structured_fields = {
        "core_concepts": CoreConceptSchema,
        "syntax": SyntaxSchema,
        "code_example": CodeExampleSchema,
        "practical_example": PracticalExampleSchema,
        "real_world_example": RealWorldExampleSchema,
        "interview_notes": InterviewSchema,
    }

    @classmethod
    def _load_string_fields(cls, content: dict) -> dict:
        return {
            field: content[field]
            for field in STRING_FIELDS
            if isinstance(content[field], str)
        }

    @classmethod
    def _load_list_of_strings_fields(cls, content: dict) -> dict:
        loaded = {}
        for field in LIST_OF_STRINGS_FIELDS:
            value = content[field]
            if not _is_list_of_strings(value):
                raise ValidationError(f"`content.{field}` must be a list of strings.")
            loaded[field] = list(value)
        return loaded

    @classmethod
    def _load_structured_list(cls, content: dict, *, field: str, item_schema: type[BaseObjectSchema]) -> list[dict]:
        value = content[field]
        if not isinstance(value, list):
            raise ValidationError(f"`content.{field}` must be a list.")

        return [
            item_schema.load(item, path=f"content.{field}[{idx}]")
            for idx, item in enumerate(value)
        ]

    @classmethod
    def load(cls, content: object) -> dict:
        if not isinstance(content, dict):
            raise ValidationError("`content` must be an object (JSON).")

        missing = [key for key in REQUIRED_KEYS if key not in content]
        if missing:
            raise ValidationError("`content` is missing required keys.", details={"missing": missing})

        for field in STRING_FIELDS:
            if not isinstance(content.get(field), str):
                raise ValidationError(f"`content.{field}` must be a string.")

        sanitized = cls._load_string_fields(content)
        sanitized.update(cls._load_list_of_strings_fields(content))

        for field, schema in cls.structured_fields.items():
            sanitized[field] = cls._load_structured_list(content, field=field, item_schema=schema)

        return sanitized


def validate_note_content(content: object) -> dict:
    return NoteContentSchema.load(content)
