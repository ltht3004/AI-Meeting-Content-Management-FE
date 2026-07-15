import sys
sys.path.insert(0, 'c:/Users/ADMIN/OneDrive/Desktop/Angular/BE/AI-Meeting-Content-Management-BE')
from dotenv import load_dotenv
load_dotenv('c:/Users/ADMIN/OneDrive/Desktop/Angular/BE/AI-Meeting-Content-Management-BE/.env')
from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
with engine.connect() as conn:
    conn.execute(text("UPDATE users SET status = 'Inactive' WHERE status = 'Unactive'"))
    conn.commit()
    print("Updated Unactive to Inactive")
