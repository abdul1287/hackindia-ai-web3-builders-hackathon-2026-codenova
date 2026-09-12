import sys
import os
from datetime import datetime, timedelta

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine, Base
from app.models.authority import Authority
from app.models.complaint import Complaint
from app.models.status_history import StatusHistory
from app.schemas.status import StatusEnum

def seed_database():
    """Seeds the database with essential municipal authorities and realistic complaints."""
    print("Creating tables if they do not exist...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Checking existing authorities...")
        existing_authorities = db.query(Authority).all()
        if existing_authorities:
            print(f"Database already contains {len(existing_authorities)} authorities. Skipping seed.")
            return

        print("Seeding initial municipal authorities...")
        authorities_data = [
            {
                "name": "Public Works Department",
                "department": "Road Infrastructure",
                "category": "road_infrastructure",
                "area": "Noida Sectors 1-128",
            },
            {
                "name": "Sanitation Department",
                "department": "Sanitation & Waste Management",
                "category": "sanitation",
                "area": "Noida Sectors 1-128",
            },
            {
                "name": "Electrical Department",
                "department": "Electrical & Lighting",
                "category": "electrical",
                "area": "Noida Sectors 1-128",
            },
            {
                "name": "Water Department",
                "department": "Water Supply & Sewage",
                "category": "water_supply",
                "area": "Noida Sectors 1-128",
            },
            {
                "name": "Municipal Engineering Department",
                "department": "Urban Safety & Engineering",
                "category": "urban_safety",
                "area": "Noida Sectors 1-128",
            },
        ]

        auth_map = {}
        for item in authorities_data:
            auth = Authority(
                name=item["name"],
                department=item["department"],
                category=item["category"],
                area=item["area"],
                is_active=True,
            )
            db.add(auth)
            db.flush()
            auth_map[item["name"]] = auth

        print("Seeding realistic hackathon complaints...")
        now = datetime.now()

        # Complaint 1: Pothole (SUBMITTED)
        pwd = auth_map["Public Works Department"]
        c1 = Complaint(
            complaint_id="CIV-2026-10482",
            issue_type="pothole",
            category="road_infrastructure",
            severity="high",
            safety_risk=True,
            ai_description="Deep cavity detected on active vehicular carriageway with degraded bitumen base.",
            complaint_title="Hazardous Deep Pothole on Sector 62 Main Roadway",
            complaint_description="A large asphalt pothole has developed on the primary carriageway. Multiple two-wheelers have experienced near-accidents. Immediate asphalt cold-mix patching and warning barricades required.",
            image_url="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
            latitude=28.6280,
            longitude=77.3649,
            location_text="Sector 62, Noida",
            authority_id=pwd.id,
            status=StatusEnum.SUBMITTED.value,
            created_at=now - timedelta(minutes=45),
            updated_at=now - timedelta(minutes=45),
        )
        db.add(c1)
        db.flush()
        h1 = StatusHistory(
            complaint_id=c1.id,
            status=StatusEnum.SUBMITTED.value,
            changed_at=now - timedelta(minutes=45),
            note="AI detected pothole (High severity) and automatically routed ticket to Public Works Department."
        )
        db.add(h1)

        # Complaint 2: Garbage (IN_PROGRESS)
        san = auth_map["Sanitation Department"]
        c2 = Complaint(
            complaint_id="CIV-2026-10481",
            issue_type="garbage",
            category="sanitation",
            severity="medium",
            safety_risk=False,
            ai_description="Uncontrolled solid municipal waste spilling beyond community waste bin onto pedestrian sidewalk.",
            complaint_title="Severe Waste Overflow Obstructing Commercial Walkway",
            complaint_description="Unattended waste accumulation causing environmental hygiene concerns and blocking pedestrian path. Requesting mechanized compactor pickup and waste disposal.",
            image_url="https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=800&q=80",
            latitude=28.5991,
            longitude=77.3610,
            location_text="Sector 61, Noida",
            authority_id=san.id,
            status=StatusEnum.IN_PROGRESS.value,
            created_at=now - timedelta(hours=18),
            updated_at=now - timedelta(hours=2),
        )
        db.add(c2)
        db.flush()
        db.add(StatusHistory(
            complaint_id=c2.id,
            status=StatusEnum.SUBMITTED.value,
            changed_at=now - timedelta(hours=18),
            note="Complaint received and assigned to Sanitation Department."
        ))
        db.add(StatusHistory(
            complaint_id=c2.id,
            status=StatusEnum.ASSIGNED.value,
            changed_at=now - timedelta(hours=12),
            note="Assigned to Ward Supervisor M. Verma for fleet deployment."
        ))
        db.add(StatusHistory(
            complaint_id=c2.id,
            status=StatusEnum.IN_PROGRESS.value,
            changed_at=now - timedelta(hours=2),
            note="Sanitation crew #4 deployed with mechanical compactor. Waste clearance underway."
        ))

        # Complaint 3: Streetlight (RESOLVED)
        elec = auth_map["Electrical Department"]
        c3 = Complaint(
            complaint_id="CIV-2026-10480",
            issue_type="streetlight",
            category="electrical",
            severity="low",
            safety_risk=False,
            ai_description="Streetlight luminaire non-functional during night hours.",
            complaint_title="Non-Functional Streetlight Luminaire #SL-402",
            complaint_description="Streetlight unit #SL-402 failed to turn on creating dark zones along Sector 60 avenue. Requesting bulb replacement.",
            image_url="https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80",
            latitude=28.5900,
            longitude=77.3500,
            location_text="Sector 60, Noida",
            authority_id=elec.id,
            status=StatusEnum.RESOLVED.value,
            created_at=now - timedelta(days=2),
            updated_at=now - timedelta(hours=4),
        )
        db.add(c3)
        db.flush()
        db.add(StatusHistory(
            complaint_id=c3.id,
            status=StatusEnum.SUBMITTED.value,
            changed_at=now - timedelta(days=2),
            note="Streetlight failure logged."
        ))
        db.add(StatusHistory(
            complaint_id=c3.id,
            status=StatusEnum.IN_PROGRESS.value,
            changed_at=now - timedelta(days=1),
            note="Linesman dispatched for LED luminaire replacement."
        ))
        db.add(StatusHistory(
            complaint_id=c3.id,
            status=StatusEnum.RESOLVED.value,
            changed_at=now - timedelta(hours=4),
            note="LED fixture replaced and tested. Illumination restored."
        ))

        db.commit()
        print("Database seeded successfully with 5 authorities and 3 sample complaints!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
