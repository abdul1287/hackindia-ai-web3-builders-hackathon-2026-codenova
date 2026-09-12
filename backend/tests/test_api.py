import pytest
from app.utils.complaint_id import generate_complaint_id
from app.services.authority_service import get_authority_mapping

def test_health_check(client):
    """Verifies health check endpoint returns 200 OK and expected structure."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "CivicAI Backend" in data["service"]

def test_authority_routing_deterministic_mapping():
    """Verifies deterministic category and issue_type mapping."""
    pothole_map = get_authority_mapping("pothole", "road_infrastructure")
    assert pothole_map["name"] == "Public Works Department"

    garbage_map = get_authority_mapping("garbage", "sanitation")
    assert garbage_map["name"] == "Sanitation Department"

    streetlight_map = get_authority_mapping("streetlight", "electrical")
    assert streetlight_map["name"] == "Electrical Department"

    water_map = get_authority_mapping("water_leakage", "water_supply")
    assert water_map["name"] == "Water Department"

    manhole_map = get_authority_mapping("open_manhole", "urban_safety")
    assert manhole_map["name"] == "Municipal Engineering Department"

def test_complaint_id_format():
    """Verifies that generated complaint IDs match the CIV-YYYY-XXXXX format."""
    cid = generate_complaint_id()
    assert cid.startswith("CIV-")
    parts = cid.split("-")
    assert len(parts) == 3
    assert len(parts[1]) == 4  # Year
    assert len(parts[2]) == 5  # 5 digits

def test_create_and_get_complaint(client, sample_authority):
    """Verifies complete complaint creation, tracking ID generation, and detail retrieval."""
    payload = {
        "issue_type": "pothole",
        "category": "road_infrastructure",
        "severity": "high",
        "safety_risk": True,
        "complaint_title": "Deep Pothole at Sector 62",
        "complaint_description": "Large asphalt pothole causing traffic obstruction.",
        "image_url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7",
        "latitude": 28.6280,
        "longitude": 77.3649,
        "location_text": "Sector 62, Noida",
        "authority_id": sample_authority.id,
        "ai_description": "Asphalt cavity detected."
    }

    # Create complaint
    create_res = client.post("/api/complaints", json=payload)
    assert create_res.status_code == 201
    created_data = create_res.json()

    assert created_data["status"] == "SUBMITTED"
    assert created_data["complaint_id"].startswith("CIV-")
    assert len(created_data["status_history"]) >= 1
    assert created_data["status_history"][0]["status"] == "SUBMITTED"

    complaint_id = created_data["complaint_id"]

    # Get complaint by formatted ID
    get_res = client.get(f"/api/complaints/{complaint_id}")
    assert get_res.status_code == 200
    fetched_data = get_res.json()
    assert fetched_data["complaint_id"] == complaint_id
    assert fetched_data["authority"]["name"] == sample_authority.name

def test_status_update_audit_trail(client, sample_authority):
    """Verifies status lifecycle transitions and immutable history log."""
    # Create initial complaint
    payload = {
        "issue_type": "garbage",
        "category": "sanitation",
        "severity": "medium",
        "complaint_title": "Overflowing waste bin",
        "complaint_description": "Solid waste overflowing on sidewalk.",
        "image_url": "https://images.unsplash.com/photo-1605600659873-d808a13e4d2a",
        "authority_id": sample_authority.id
    }
    create_res = client.post("/api/complaints", json=payload)
    assert create_res.status_code == 201
    cid = create_res.json()["complaint_id"]

    # Transition to IN_PROGRESS
    patch_res = client.patch(
        f"/api/complaints/{cid}/status",
        json={"status": "IN_PROGRESS", "note": "Compactor truck dispatched to Sector 61."}
    )
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["status"] == "IN_PROGRESS"
    assert len(updated["status_history"]) == 2
    assert updated["status_history"][1]["status"] == "IN_PROGRESS"
    assert "Compactor truck" in updated["status_history"][1]["note"]

    # Transition to RESOLVED
    patch_res_2 = client.patch(
        f"/api/complaints/{cid}/status",
        json={"status": "RESOLVED", "note": "Waste collected and area sanitized."}
    )
    assert patch_res_2.status_code == 200
    resolved = patch_res_2.json()
    assert resolved["status"] == "RESOLVED"
    assert len(resolved["status_history"]) == 3
    assert resolved["status_history"][2]["status"] == "RESOLVED"

def test_invalid_status_rejection(client, sample_authority):
    """Verifies that unapproved statuses are rejected with 422."""
    payload = {
        "issue_type": "pothole",
        "category": "road_infrastructure",
        "severity": "high",
        "complaint_title": "Pothole",
        "complaint_description": "Road defect",
        "image_url": "https://example.com/pothole.jpg",
        "authority_id": sample_authority.id
    }
    create_res = client.post("/api/complaints", json=payload)
    cid = create_res.json()["complaint_id"]

    patch_res = client.patch(
        f"/api/complaints/{cid}/status",
        json={"status": "MAGIC_STATUS", "note": "Invalid status test"}
    )
    assert patch_res.status_code == 422

def test_coordinate_boundary_validation(client, sample_authority):
    """Verifies that out-of-range coordinates are rejected with 422."""
    payload = {
        "issue_type": "pothole",
        "category": "road_infrastructure",
        "severity": "high",
        "complaint_title": "Pothole with invalid GPS",
        "complaint_description": "Road defect",
        "image_url": "https://example.com/pothole.jpg",
        "latitude": 150.0,  # Invalid (> 90.0)
        "longitude": 77.0,
        "authority_id": sample_authority.id
    }
    res = client.post("/api/complaints", json=payload)
    assert res.status_code == 422

def test_authorities_endpoints(client, sample_authority):
    """Verifies GET /api/authorities and GET /api/authorities/{id}/complaints."""
    # List authorities
    res = client.get("/api/authorities")
    assert res.status_code == 200
    auth_list = res.json()
    assert len(auth_list) >= 1

    # List authority complaints
    complaints_res = client.get(f"/api/authorities/{sample_authority.id}/complaints")
    assert complaints_res.status_code == 200
    data = complaints_res.json()
    assert "items" in data
    assert "total" in data
