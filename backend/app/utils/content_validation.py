from __future__ import annotations
import logging
from app.utils.errors import ValidationError

logger = logging.getLogger(__name__)

STRING_FIELDS = (
    "definition",
)

HYBRID_FIELDS = (
    "problem_it_solves",
    "detailed_explanation",
    "how_it_works",
)

LIST_OF_STRINGS_FIELDS = (
    "common_mistakes",
    "best_practices",
)

STRUCTURED_LIST_FIELDS = (
    "core_concepts",
    "syntax",
    "code_example",
    "practical_example",
    "real_world_example",
    "interview_notes",
)

REQUIRED_KEYS = (
    *STRING_FIELDS,
    *HYBRID_FIELDS,
    *STRUCTURED_LIST_FIELDS,
    *LIST_OF_STRINGS_FIELDS,
)


def validate_primitive_field(value, *, path: str, allow_empty: bool = False) -> str:
    """Validates that a field is a string."""
    if not isinstance(value, str):
        raise ValidationError(f"`{path}` must be a string.")
    if not allow_empty and not value.strip():
        raise ValidationError(f"`{path}` must be a non-empty string.")
    return value

def validate_rich_content(value, *, path: str) -> dict:
    """Validates that a field is a rich structured object."""
    if not isinstance(value, dict):
        raise ValidationError(f"`{path}` must be a rich content object.")
    if value.get("type") != "rich":
        raise ValidationError(f"`{path}.type` must be 'rich'.")
    
    blocks = value.get("blocks")
    if not isinstance(blocks, list):
        raise ValidationError(f"`{path}.blocks` must be a list.")
        
    valid_types = {"paragraph", "diagram", "bullets", "numbered_list", "callout", "code", "table"}
    for idx, block in enumerate(blocks):
        if not isinstance(block, dict):
            raise ValidationError(f"`{path}.blocks[{idx}]` must be an object.")
        b_type = block.get("type")
        if not b_type:
             raise ValidationError(f"`{path}.blocks[{idx}].type` is missing.")
        # We allow other types if needed, but we check presence of type
        if b_type not in valid_types:
            logger.warning(f"Unrecognized block type '{b_type}' at `{path}.blocks[{idx}]`.")
            
    return value

def validate_hybrid_field(value, *, path: str):
    """Validates that a field is EITHER a string OR a rich structured object."""
    if isinstance(value, str):
        if not value.strip():
            raise ValidationError(f"`{path}` must be a non-empty string.")
        return value
    if isinstance(value, dict) and value.get("type") == "rich":
        return validate_rich_content(value, path=path)
    raise ValidationError(f"`{path}` must be a non-empty string or a rich content object.")

def validate_collection_field(value, *, path: str, item_validator) -> list:
    """Validates that a field is a list and applies a schema validator to each child."""
    if not isinstance(value, list):
        raise ValidationError(f"`{path}` must be a list.")
    validated = []
    for idx, item in enumerate(value):
        validated.append(item_validator(item, path=f"{path}[{idx}]"))
    return validated

def validate_list_of_strings_or_rich(value, *, path: str):
    """Validates that a field is EITHER a list of strings OR a rich structured object."""
    if isinstance(value, list):
        validated = []
        for idx, item in enumerate(value):
            if not isinstance(item, str):
                raise ValidationError(f"`{path}[{idx}]` must be a string.")
            if item.strip():
                validated.append(item.strip())
        return validated
    if isinstance(value, dict) and value.get("type") == "rich":
        return validate_rich_content(value, path=path)
    raise ValidationError(f"`{path}` must be a list of strings or a rich content object.")

def _extract_text_fallback(val) -> str:
    """Extract text from a rich object or other to fallback as string if needed."""
    if isinstance(val, str):
        return val
    if isinstance(val, dict) and val.get("type") == "rich":
        lines = []
        for block in val.get("blocks", []):
            if block.get("type") == "bullets":
                for item in block.get("items", []):
                    if isinstance(item, dict) and item.get("text"):
                        lines.append(item.get("text"))
                    elif isinstance(item, str):
                        lines.append(item)
            elif block.get("type") == "paragraph" and block.get("content"):
                lines.append(block.get("content"))
        return "\n".join(lines) if lines else "See detailed content."
    return ""

def normalize_content_payload(content: object) -> dict:
    """
    Unified normalization layer to salvage malformed AI payloads
    and preserve structure before strict schema validation.
    """
    if not isinstance(content, dict):
        return {}
    
    payload = dict(content)
    
    # Category A (Primitive Fields) - force to string if not string
    for field in STRING_FIELDS:
        val = payload.get(field)
        if val is not None and not isinstance(val, str):
            payload[field] = _extract_text_fallback(val)

    # Category B (Hybrid Fields) - only rescue if it's completely malformed (not string or rich dict)
    for field in HYBRID_FIELDS:
        val = payload.get(field)
        if val is not None:
            if not (isinstance(val, str) or (isinstance(val, dict) and val.get("type") == "rich")):
                payload[field] = _extract_text_fallback(val) if _extract_text_fallback(val) else str(val)

    # Category C (Collection Fields) - Ensure they are arrays
    
    # 1. core_concepts
    val = payload.get("core_concepts")
    if not isinstance(val, list):
        if isinstance(val, str) or (isinstance(val, dict) and val.get("type") == "rich"):
            payload["core_concepts"] = [{"name": "Core Concept", "explanation": val}]
        else:
            payload["core_concepts"] = []
            
    # 2. syntax
    val = payload.get("syntax")
    if not isinstance(val, list):
        if isinstance(val, str) or (isinstance(val, dict) and val.get("type") == "rich"):
            payload["syntax"] = [{"title": "Syntax", "language": "text", "code": _extract_text_fallback(val)}]
        else:
            payload["syntax"] = []
            
    # 3. code_example
    val = payload.get("code_example")
    if not isinstance(val, list):
        if isinstance(val, str) or (isinstance(val, dict) and val.get("type") == "rich"):
            payload["code_example"] = [{"title": "Code Example", "language": "text", "code": _extract_text_fallback(val)}]
        else:
            payload["code_example"] = []
            
    # 4. practical_example
    val = payload.get("practical_example")
    if not isinstance(val, list):
        if isinstance(val, str) or (isinstance(val, dict) and val.get("type") == "rich"):
            payload["practical_example"] = [{"title": "Practical Example", "description": "Description", "code": "", "explanation": val}]
        else:
            payload["practical_example"] = []
            
    # 5. real_world_example
    val = payload.get("real_world_example")
    if not isinstance(val, list):
        if isinstance(val, str) or (isinstance(val, dict) and val.get("type") == "rich"):
            payload["real_world_example"] = [{"title": "Real World Case", "description": _extract_text_fallback(val)}]
        else:
            payload["real_world_example"] = []
            
    # 6. interview_notes
    val = payload.get("interview_notes")
    if not isinstance(val, list):
        if isinstance(val, str) or (isinstance(val, dict) and val.get("type") == "rich"):
            payload["interview_notes"] = [{"question": "Interview Question", "answer": val}]
        else:
            payload["interview_notes"] = []
            
    # 7 & 8. common_mistakes, best_practices
    for field in LIST_OF_STRINGS_FIELDS:
        val = payload.get(field)
        if isinstance(val, str):
            payload[field] = [line.strip("- ").strip() for line in val.split("\n") if line.strip()]
        elif isinstance(val, dict) and val.get("type") == "rich":
            pass # PRESERVE rich object; do not extract text
        elif not isinstance(val, list):
            payload[field] = []

    # Ensure internal shape of objects in collections
    
    # core_concepts: name(str), explanation(hybrid)
    cc = []
    for item in payload.get("core_concepts", []):
        if isinstance(item, str):
            cc.append({"name": "Core Concept", "explanation": item})
        elif isinstance(item, dict):
            cc.append({
                "name": _extract_text_fallback(item.get("name", "Core Concept")),
                "explanation": item.get("explanation", "Explanation missing")
            })
    payload["core_concepts"] = cc

    # syntax: title(str), language(str), code(str)
    sy = []
    for item in payload.get("syntax", []):
        if isinstance(item, str):
            sy.append({"title": "Syntax", "language": "text", "code": item})
        elif isinstance(item, dict):
            sy.append({
                "title": _extract_text_fallback(item.get("title", "Syntax")),
                "language": _extract_text_fallback(item.get("language", "text")),
                "code": _extract_text_fallback(item.get("code", ""))
            })
    payload["syntax"] = sy

    # code_example: title(str), language(str), code(str)
    ce = []
    for item in payload.get("code_example", []):
        if isinstance(item, str):
            ce.append({"title": "Code Example", "language": "text", "code": item})
        elif isinstance(item, dict):
            ce.append({
                "title": _extract_text_fallback(item.get("title", "Code Example")),
                "language": _extract_text_fallback(item.get("language", "text")),
                "code": _extract_text_fallback(item.get("code", ""))
            })
    payload["code_example"] = ce

    # practical_example: title(str), description(str), code(str), explanation(hybrid)
    pe = []
    for item in payload.get("practical_example", []):
        if isinstance(item, str):
            pe.append({"title": "Practical Example", "description": "Description", "code": "", "explanation": item})
        elif isinstance(item, dict):
            pe.append({
                "title": _extract_text_fallback(item.get("title", "Practical Example")),
                "description": _extract_text_fallback(item.get("description", "Description")),
                "code": _extract_text_fallback(item.get("code", "")),
                "explanation": item.get("explanation", "Explanation missing")
            })
    payload["practical_example"] = pe

    # real_world_example: title(str), description(str)
    rwe = []
    for item in payload.get("real_world_example", []):
        if isinstance(item, str):
            rwe.append({"title": "Real World Case", "description": item})
        elif isinstance(item, dict):
            rwe.append({
                "title": _extract_text_fallback(item.get("title", "Real World Case")),
                "description": _extract_text_fallback(item.get("description", "Description"))
            })
    payload["real_world_example"] = rwe

    # interview_notes: question(str), answer(hybrid)
    ino = []
    for item in payload.get("interview_notes", []):
        if isinstance(item, str):
            ino.append({"question": "Interview Question", "answer": item})
        elif isinstance(item, dict):
            ino.append({
                "question": _extract_text_fallback(item.get("question", "Interview Question")),
                "answer": item.get("answer", "Answer missing")
            })
    payload["interview_notes"] = ino

    return payload


# --- Collection Item Validators ---

def validate_core_concept_item(item: dict, *, path: str) -> dict:
    if not isinstance(item, dict):
        raise ValidationError(f"`{path}` must be an object.")
    return {
        "name": validate_primitive_field(item.get("name"), path=f"{path}.name"),
        "explanation": validate_hybrid_field(item.get("explanation"), path=f"{path}.explanation")
    }

def validate_syntax_item(item: dict, *, path: str) -> dict:
    if not isinstance(item, dict):
        raise ValidationError(f"`{path}` must be an object.")
    return {
        "title": validate_primitive_field(item.get("title"), path=f"{path}.title"),
        "language": validate_primitive_field(item.get("language"), path=f"{path}.language"),
        "code": validate_primitive_field(item.get("code", ""), path=f"{path}.code", allow_empty=True)
    }

def validate_code_example_item(item: dict, *, path: str) -> dict:
    if not isinstance(item, dict):
        raise ValidationError(f"`{path}` must be an object.")
    return {
        "title": validate_primitive_field(item.get("title"), path=f"{path}.title"),
        "language": validate_primitive_field(item.get("language"), path=f"{path}.language"),
        "code": validate_primitive_field(item.get("code", ""), path=f"{path}.code", allow_empty=True)
    }

def validate_practical_example_item(item: dict, *, path: str) -> dict:
    if not isinstance(item, dict):
        raise ValidationError(f"`{path}` must be an object.")
    return {
        "title": validate_primitive_field(item.get("title"), path=f"{path}.title"),
        "description": validate_primitive_field(item.get("description"), path=f"{path}.description"),
        "code": validate_primitive_field(item.get("code", ""), path=f"{path}.code", allow_empty=True),
        "explanation": validate_hybrid_field(item.get("explanation"), path=f"{path}.explanation")
    }

def validate_real_world_example_item(item: dict, *, path: str) -> dict:
    if not isinstance(item, dict):
        raise ValidationError(f"`{path}` must be an object.")
    return {
        "title": validate_primitive_field(item.get("title"), path=f"{path}.title"),
        "description": validate_primitive_field(item.get("description"), path=f"{path}.description")
    }

def validate_interview_note_item(item: dict, *, path: str) -> dict:
    if not isinstance(item, dict):
        raise ValidationError(f"`{path}` must be an object.")
    return {
        "question": validate_primitive_field(item.get("question"), path=f"{path}.question"),
        "answer": validate_hybrid_field(item.get("answer"), path=f"{path}.answer")
    }


def validate_note_content(content: object) -> dict:
    """
    Main entry point for validating and sanitizing a note's content payload.
    Ensures that the entire payload adheres to the expected schemas.
    """
    if not isinstance(content, dict):
        raise ValidationError("`content` must be an object (JSON).")

    content = normalize_content_payload(content)

    missing = [key for key in REQUIRED_KEYS if key not in content]
    if missing:
        raise ValidationError("`content` is missing required keys.", details={"missing": missing})

    sanitized = {}

    # Validate Primitive Fields
    for field in STRING_FIELDS:
        sanitized[field] = validate_primitive_field(content.get(field), path=f"content.{field}")

    # Validate Hybrid Fields
    for field in HYBRID_FIELDS:
        sanitized[field] = validate_hybrid_field(content.get(field), path=f"content.{field}")

    # Validate List of Strings OR Rich Content
    for field in LIST_OF_STRINGS_FIELDS:
        sanitized[field] = validate_list_of_strings_or_rich(content.get(field), path=f"content.{field}")

    # Validate Structured Collections
    sanitized["core_concepts"] = validate_collection_field(
        content.get("core_concepts"), path="content.core_concepts", item_validator=validate_core_concept_item
    )
    sanitized["syntax"] = validate_collection_field(
        content.get("syntax"), path="content.syntax", item_validator=validate_syntax_item
    )
    sanitized["code_example"] = validate_collection_field(
        content.get("code_example"), path="content.code_example", item_validator=validate_code_example_item
    )
    sanitized["practical_example"] = validate_collection_field(
        content.get("practical_example"), path="content.practical_example", item_validator=validate_practical_example_item
    )
    sanitized["real_world_example"] = validate_collection_field(
        content.get("real_world_example"), path="content.real_world_example", item_validator=validate_real_world_example_item
    )
    sanitized["interview_notes"] = validate_collection_field(
        content.get("interview_notes"), path="content.interview_notes", item_validator=validate_interview_note_item
    )

    return sanitized
