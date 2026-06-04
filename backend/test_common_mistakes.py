import sys
from app.utils.content_validation import normalize_content_payload, validate_note_content

payload = {
    "definition": "def",
    "problem_it_solves": "prob",
    "detailed_explanation": "detail",
    "core_concepts": [],
    "how_it_works": "how",
    "syntax": [],
    "code_example": [],
    "practical_example": [],
    "real_world_example": [],
    "interview_notes": [],
    "common_mistakes": {
        "type": "rich",
        "blocks": [
            {
                "type": "table",
                "headers": ["Bad", "Good"],
                "rows": [["x=1", "const x=1"]]
            }
        ]
    },
    "best_practices": []
}

normalized = normalize_content_payload(payload)
print("Normalized common_mistakes:", normalized.get("common_mistakes"))

try:
    validated = validate_note_content(payload)
    print("Validated common_mistakes:", validated.get("common_mistakes"))
except Exception as e:
    print("Validation Error:", e)

