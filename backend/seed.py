import json

from app import create_app
from app.services.auth_service import AuthService
from app.utils.db import db
from app.models import Note, NoteVersion, Topic, VersionType
from app.utils.slugify import slugify


SIMPLE_CONTENT = {
    "definition": "A closure is a function that remembers the variables from its outer scope, even after the outer function has finished running.",
    "problem_it_solves": "It helps you keep data private and preserve state without using global variables.",
    "detailed_explanation": "In JavaScript, functions form closures. When you create an inner function that uses variables from an outer function, those variables remain accessible as long as the inner function exists.",
    "core_concepts": [
        {"name": "Lexical scope", "explanation": "Scope is determined by where code is written, not where it is executed."},
        {"name": "Inner function", "explanation": "The inner function can access variables declared in the outer function."},
    ],
    "how_it_works": "The JavaScript engine keeps the outer variables alive because the inner function still references them.",
    "syntax": "function outer(){ const x=1; return function inner(){ return x; }}",
    "code_example": "function makeCounter(){ let c=0; return () => ++c; }",
    "practical_example": "Use closures to build counters, memoization, and factories.",
    "real_world_example": "Event handlers often close over state from the time they were created.",
    "common_mistakes": ["Assuming closures copy values instead of referencing variables."],
    "best_practices": ["Keep closed-over state minimal."],
    "interview_notes": ["Explain lexical scope and give a counter example."],
}

INDUSTRY_CONTENT = {
    "definition": "A closure is a function bundled with references to its surrounding lexical environment, enabling encapsulated state and behavior.",
    "problem_it_solves": "Enables encapsulation, partial application, and controlled side effects without exposing internal state.",
    "detailed_explanation": "Closures arise when functions capture free variables from enclosing scopes. In modern JS engines, captured bindings are represented in environment records that remain reachable while referenced by inner functions.",
    "core_concepts": [
        {"name": "Environment record", "explanation": "Runtime structure that stores bindings for captured variables."},
        {"name": "Garbage collection", "explanation": "Captured environments remain until no closures reference them."},
    ],
    "how_it_works": "When an inner function references outer bindings, the engine ensures those bindings remain accessible by keeping the lexical environment alive.",
    "syntax": "const fn = (() => { const secret = 42; return () => secret; })();",
    "code_example": "function memoize(fn){ const cache=new Map(); return (k)=> cache.has(k)?cache.get(k):(cache.set(k,fn(k)),cache.get(k)); }",
    "practical_example": "Use closures for memoization, dependency injection, and module patterns.",
    "real_world_example": "React hooks rely on closures; stale closures are a common source of bugs in async handlers.",
    "common_mistakes": ["Stale closure in async callbacks capturing outdated state."],
    "best_practices": ["Prefer pure functions; keep closure boundaries explicit; avoid accidental captures in loops."],
    "interview_notes": ["Mention performance implications and stale-closure pitfalls."],
}


def main() -> None:
    app = create_app()
    with app.app_context():
        db.create_all()
        AuthService.ensure_user_schema()
        AuthService.ensure_admin_account()

        tech_slug = slugify("JavaScript")
        technology = Topic.query.filter_by(slug=tech_slug).first()
        if not technology:
            technology = Topic(name="JavaScript", slug=tech_slug, description="Notes about JavaScript fundamentals.")
            db.session.add(technology)
            db.session.flush()

        module_slug = slugify("Functions")
        module = Topic.query.filter_by(slug=module_slug).first()
        if not module:
            module = Topic(
                name="Functions",
                slug=module_slug,
                description="Functions module in JavaScript.",
                parent_id=technology.id,
            )
            db.session.add(module)
            db.session.flush()

        topic_slug = slugify("Closures")
        topic = Topic.query.filter_by(slug=topic_slug).first()
        if not topic:
            topic = Topic(
                name="Closures",
                slug=topic_slug,
                description="Closures note in JavaScript.",
                parent_id=module.id,
            )
            db.session.add(topic)
            db.session.flush()

        note_slug = slugify("Closures")
        note = Note.query.filter_by(slug=note_slug).first()
        if not note:
            note = Note(topic_id=topic.id, title="Closures", slug=note_slug)
            db.session.add(note)
            db.session.flush()

        def upsert_version(vt: VersionType, content: dict) -> None:
            existing = NoteVersion.query.filter_by(note_id=note.id, version_type=vt).first()
            payload = json.loads(json.dumps(content))
            if existing:
                existing.content = payload
            else:
                db.session.add(NoteVersion(note_id=note.id, version_type=vt, content=payload))

        upsert_version(VersionType.SIMPLE, SIMPLE_CONTENT)
        upsert_version(VersionType.INDUSTRY, INDUSTRY_CONTENT)

        db.session.commit()
        print("Seeded: JavaScript > Functions > Closures with simple+industry versions")


if __name__ == "__main__":
    main()
