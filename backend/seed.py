import json

from app import create_app
from app.services.auth_service import AuthService
from app.utils.db import db
from app.models import NoteVersion, Topic, Technology, VersionType
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
        # Make sure DB schema is up to date (we assume migrate_db.py was run)
        db.create_all()
        AuthService.ensure_user_schema()
        AuthService.ensure_admin_account()

        def upsert_version(topic_id: int, vt: VersionType, content: dict) -> None:
            existing = NoteVersion.query.filter_by(topic_id=topic_id, version_type=vt).first()
            payload = json.loads(json.dumps(content))
            if existing:
                existing.content = payload
            else:
                db.session.add(NoteVersion(topic_id=topic_id, version_type=vt, content=payload))

        # --- SEED JAVASCRIPT ---
        js_slug = slugify("JavaScript")
        js_tech = Technology.query.filter_by(slug=js_slug).first()
        if not js_tech:
            js_tech = Technology(name="JavaScript", slug=js_slug, description="Notes about JavaScript fundamentals.")
            db.session.add(js_tech)
            db.session.flush()

        js_module_slug = slugify("Functions")
        js_module = Topic.query.filter_by(slug=js_module_slug, technology_id=js_tech.id).first()
        if not js_module:
            js_module = Topic(
                name="Functions",
                slug=js_module_slug,
                description="Functions module in JavaScript.",
                technology_id=js_tech.id,
                parent_id=None,
            )
            db.session.add(js_module)
            db.session.flush()

        closure_slug = slugify("Closures")
        closure_topic = Topic.query.filter_by(slug=closure_slug, technology_id=js_tech.id).first()
        if not closure_topic:
            closure_topic = Topic(
                name="Closures",
                slug=closure_slug,
                description="Closures note in JavaScript.",
                technology_id=js_tech.id,
                parent_id=js_module.id,
            )
            db.session.add(closure_topic)
            db.session.flush()
        
        upsert_version(closure_topic.id, VersionType.SIMPLE, SIMPLE_CONTENT)
        upsert_version(closure_topic.id, VersionType.INDUSTRY, INDUSTRY_CONTENT)


        # --- SEED REACT ---
        react_slug = slugify("React")
        react_tech = Technology.query.filter_by(slug=react_slug).first()
        if not react_tech:
            react_tech = Technology(name="React", slug=react_slug, description="Frontend library for building user interfaces.")
            db.session.add(react_tech)
            db.session.flush()

        hooks_module_slug = slugify("Hooks")
        hooks_module = Topic.query.filter_by(slug=hooks_module_slug, technology_id=react_tech.id).first()
        if not hooks_module:
            hooks_module = Topic(
                name="Hooks",
                slug=hooks_module_slug,
                description="Core React Hooks",
                technology_id=react_tech.id,
                parent_id=None,
            )
            db.session.add(hooks_module)
            db.session.flush()

        use_effect_slug = slugify("useEffect")
        use_effect_topic = Topic.query.filter_by(slug=use_effect_slug, technology_id=react_tech.id).first()
        if not use_effect_topic:
            use_effect_topic = Topic(
                name="useEffect",
                slug=use_effect_slug,
                description="Handle side effects in React.",
                technology_id=react_tech.id,
                parent_id=hooks_module.id,
            )
            db.session.add(use_effect_topic)
            db.session.flush()

        db.session.commit()
        print("Seeded: JavaScript and React sample data successfully!")


if __name__ == "__main__":
    main()
