import sys
sys.path.insert(0, 'c:/Users/ADMIN/OneDrive/Desktop/Angular/BE/AI-Meeting-Content-Management-BE')
from dotenv import load_dotenv
load_dotenv('c:/Users/ADMIN/OneDrive/Desktop/Angular/BE/AI-Meeting-Content-Management-BE/.env')
from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
with engine.connect() as conn:
    conn.execute(text('ALTER TABLE users ALTER COLUMN reset_code TYPE VARCHAR(255)'))
    conn.commit()
    print("Column reset_code successfully updated to VARCHAR(255)")
