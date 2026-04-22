from app import create_app
from app.utils.db import db
from sqlalchemy import text

def migrate():
    app = create_app()
    with app.app_context():
        # Ensure new table exists
        db.create_all()
        
        # Check if type column exists in topics (meaning we haven't fully migrated yet)
        inspector = db.inspect(db.engine)
        columns = [c['name'] for c in inspector.get_columns('topics')]
        
        if 'type' in columns:
            # 1. Insert all 'technology' topics into 'technologies' table
            # Since technologies and topics both had id, name, slug, description, created_at
            # we can just select them and insert into technologies. We should be careful about IDs.
            # If we preserve IDs, it's easier to migrate the foreign keys.
            print("Migrating technologies...")
            db.session.execute(text("""
                INSERT INTO technologies (id, name, slug, description, created_at)
                SELECT id, name, slug, description, created_at FROM topics WHERE type = 'technology'
                ON CONFLICT DO NOTHING
            """))
            db.session.commit()
            
            # 2. Add technology_id to topics if it doesn't exist
            if 'technology_id' not in columns:
                print("Adding technology_id to topics...")
                # SQLite workaround: we might not be able to add NOT NULL without default, so add nullable first
                # Actually Supabase PostgreSQL supports ADD COLUMN
                db.session.execute(text("ALTER TABLE topics ADD COLUMN IF NOT EXISTS technology_id INTEGER"))
                db.session.execute(text("ALTER TABLE topics ADD CONSTRAINT fk_topics_technology_id FOREIGN KEY (technology_id) REFERENCES technologies (id)"))
                db.session.commit()
            
            # 3. Update technology_id for all modules (type='module', parent_id=tech_id)
            print("Updating technology_id for modules...")
            db.session.execute(text("""
                UPDATE topics SET technology_id = parent_id WHERE type = 'module'
            """))
            
            # 4. Update parent_id for modules to NULL (they are roots now inside a tech)
            print("Setting module parent_ids to NULL...")
            db.session.execute(text("""
                UPDATE topics SET parent_id = NULL WHERE type = 'module'
            """))
            
            # 5. Update technology_id for topics (type='topic', parent_id=module_id)
            # We need to get the technology_id from the parent module
            print("Updating technology_id for topics...")
            db.session.execute(text("""
                UPDATE topics t SET technology_id = p.technology_id
                FROM topics p WHERE t.parent_id = p.id AND t.type = 'topic'
            """))
            
            # 6. Delete old technologies from topics table
            print("Deleting old technologies from topics...")
            db.session.execute(text("DELETE FROM topics WHERE type = 'technology'"))
            
            # 7. Drop type column
            print("Dropping type column...")
            try:
                db.session.execute(text("ALTER TABLE topics DROP COLUMN type"))
            except Exception as e:
                print(f"Could not drop type column (likely SQLite): {e}")
                
            db.session.commit()
            print("Migration complete!")
        else:
            print("No 'type' column found. Migration might already be complete.")

if __name__ == '__main__':
    migrate()
