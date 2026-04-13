from app.utils.errors import ValidationError


REQUIRED_KEYS = {
    "definition": str,
    "problem_it_solves": str,
    "detailed_explanation": str,
    "core_concepts": list,
    "how_it_works": str,
    "syntax": str,
    "code_example": str,
    "practical_example": str,
    "real_world_example": str,
    "common_mistakes": list,
    "best_practices": list,
    "interview_notes": list,
}


def _is_list_of_strings(value) -> bool:
    return isinstance(value, list) and all(isinstance(item, str) for item in value)


def _validate_core_concepts(value) -> None:
    if not isinstance(value, list):
        raise ValidationError("`core_concepts` must be a list.")
    for idx, item in enumerate(value):
        if not isinstance(item, dict):
            raise ValidationError("Each core concept must be an object.", details={"index": idx})
        name = item.get("name")
        explanation = item.get("explanation")
        if not isinstance(name, str) or not name.strip():
            raise ValidationError("Each core concept requires a non-empty `name`.", details={"index": idx})
        if not isinstance(explanation, str) or not explanation.strip():
            raise ValidationError("Each core concept requires a non-empty `explanation`.", details={"index": idx})


def validate_note_content(content: object) -> dict:
    if not isinstance(content, dict):
        raise ValidationError("`content` must be an object (JSON).")

    missing = [k for k in REQUIRED_KEYS.keys() if k not in content]
    if missing:
        raise ValidationError("`content` is missing required keys.", details={"missing": missing})

    # Validate scalar fields
    for key, expected_type in REQUIRED_KEYS.items():
        value = content.get(key)
        if expected_type is str and not isinstance(value, str):
            raise ValidationError(f"`content.{key}` must be a string.")
        if expected_type is list and not isinstance(value, list):
            raise ValidationError(f"`content.{key}` must be a list.")

    _validate_core_concepts(content["core_concepts"])

    if not _is_list_of_strings(content["common_mistakes"]):
        raise ValidationError("`content.common_mistakes` must be a list of strings.")
    if not _is_list_of_strings(content["best_practices"]):
        raise ValidationError("`content.best_practices` must be a list of strings.")
    if not _is_list_of_strings(content["interview_notes"]):
        raise ValidationError("`content.interview_notes` must be a list of strings.")

    # Return a JSON-serializable copy (prevents accidental non-serializable values).
    return {
        "definition": content["definition"],
        "problem_it_solves": content["problem_it_solves"],
        "detailed_explanation": content["detailed_explanation"],
        "core_concepts": [{"name": c["name"], "explanation": c["explanation"]} for c in content["core_concepts"]],
        "how_it_works": content["how_it_works"],
        "syntax": content["syntax"],
        "code_example": content["code_example"],
        "practical_example": content["practical_example"],
        "real_world_example": content["real_world_example"],
        "common_mistakes": list(content["common_mistakes"]),
        "best_practices": list(content["best_practices"]),
        "interview_notes": list(content["interview_notes"]),
    }

