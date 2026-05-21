from app.utils.content_validation import validate_note_content
import json

primitive_payload = {
    "definition": "A test definition.",
    "problem_it_solves": "Solves bugs.",
    "detailed_explanation": "Explains things.",
    "how_it_works": "It just works.",
    "common_mistakes": ["Mistake 1"],
    "best_practices": ["Practice 1"],
    "core_concepts": [{"name": "Concept", "explanation": "Concept explanation"}],
    "syntax": [{"title": "Syntax", "language": "python", "code": "print('hello')"}],
    "code_example": [{"title": "Example", "language": "python", "code": "print('hello')"}],
    "practical_example": [{"title": "Example", "description": "Desc", "code": "print('hello')", "explanation": "Expl"}],
    "real_world_example": [{"title": "Real World", "description": "Desc"}],
    "interview_notes": [{"question": "Q?", "answer": "A"}]
}

try:
    res = validate_note_content(primitive_payload)
    print("Primitive validation passed!")
except Exception as e:
    print(f"Primitive validation failed: {e}")

rich_payload = dict(primitive_payload)
rich_payload["detailed_explanation"] = {"type": "rich", "blocks": [{"type": "paragraph"}]}
rich_payload["practical_example"] = [{"title": "Example", "description": "Desc", "code": "print('hello')", "explanation": {"type": "rich", "blocks": [{"type": "paragraph"}]}}]

try:
    res = validate_note_content(rich_payload)
    print("Rich validation passed!")
except Exception as e:
    print(f"Rich validation failed: {e}")

malformed_payload = dict(primitive_payload)
malformed_payload["practical_example"] = "Just a string fallback"
malformed_payload["detailed_explanation"] = ["This is a bad array, should be forced to string"]

try:
    res = validate_note_content(malformed_payload)
    print("Malformed validation recovered and passed!")
    print("Recovered practical_example:", json.dumps(res["practical_example"], indent=2))
    print("Recovered detailed_explanation:", type(res["detailed_explanation"]))
except Exception as e:
    print(f"Malformed validation failed: {e}")
