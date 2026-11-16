# Bhumi Era - API Endpoint Specifications & Test Responses

This document outlines the API specifications and exact JSON responses for all available endpoints.

---

## 🔑 Authentication Endpoint

### 1. User Login
- **Endpoint**: `POST /api/auth/login`
- **Authentication**: None
- **Content-Type**: `application/json`

#### Request Payload
```json
{
  "email": "admin@bhumiera.com",
  "password": "<admin-password>"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Login successful!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0Y...",
  "user": {
    "id": "603d2b2f81c9cf3500a2d590",
    "email": "admin@bhumiera.com"
  }
}
```

#### Error Response: Missing Fields (`400 Bad Request`)
```json
{
  "success": false,
  "message": "Please provide email and password"
}
```

#### Error Response: Invalid Credentials (`401 Unauthorized`)
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

## 🏠 Property Endpoints

> [!IMPORTANT]
> All property endpoints require a valid JWT bearer token in the `Authorization` header:
> `Authorization: Bearer <your_jwt_token>`

### 2. Get All Properties
- **Endpoints**: `GET /api/properties`
- **Authentication**: JWT Required

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "65b53cb1c98fe3a890f5c123",
      "propertyName": "Bhumi Era Phase 1",
      "zoneClassification": "Residential",
      "frontFacing": "East",
      "roadWidthFt": 40,
      "roadConnectivity": "Main Highway",
      "lengthM": 50,
      "widthM": 30,
      "ratePerSqFt": 1500,
      "cluAvailability": "Available",
      "nearbyRoadName": "G.T. Road",
      "latitude": 28.6139,
      "longitude": 77.209,
      "mediaFiles": [
        "uploads/1706346673456-993827162.jpg"
      ],
      "createdAt": "2026-07-07T05:42:06.000Z",
      "updatedAt": "2026-07-07T06:00:00.000Z"
    }
  ]
}
```

---

### 3. Get Property By ID
- **Endpoint**: `GET /api/properties/:id`
- **Authentication**: JWT Required

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "_id": "65b53cb1c98fe3a890f5c123",
    "propertyName": "Bhumi Era Phase 1",
    "zoneClassification": "Residential",
    "frontFacing": "East",
    "roadWidthFt": 40,
    "roadConnectivity": "Main Highway",
    "lengthM": 50,
    "widthM": 30,
    "ratePerSqFt": 1500,
    "cluAvailability": "Available",
    "nearbyRoadName": "G.T. Road",
    "latitude": 28.6139,
    "longitude": 77.209,
    "mediaFiles": [
      "uploads/1706346673456-993827162.jpg"
    ],
    "createdAt": "2026-07-07T05:42:06.000Z",
    "updatedAt": "2026-07-07T06:00:00.000Z"
  }
}
```

#### Error Response: Not Found (`404 Not Found`)
```json
{
  "success": false,
  "message": "Property not found"
}
```

---

### 4. Create Property
- **Endpoints**:
  - `POST /api/properties` (REST Standard)
  - `POST /api/properties/add` (Alternative Route)
  - `POST /api/properties/create` (Alternative Route)
- **Authentication**: JWT Required
- **Content-Type**: `multipart/form-data` or `application/json` (without uploads)

#### Request Payload
| Field | Type | Required | Description / Enum |
| :--- | :--- | :--- | :--- |
| `propertyName` | String | **Yes** | Unique name identifying the property |
| `zoneClassification`| String | No | Zone category (e.g. Residential, Commercial) |
| `frontFacing` | String | No | Facing direction (e.g. East, West) |
| `roadWidthFt` | Number | No | Width of adjacent road in feet |
| `roadConnectivity` | String | No | Connection highway/road description |
| `lengthM` | Number | No | Length in meters |
| `widthM` | Number | No | Width in meters |
| `ratePerSqFt` | Number | No | Price per square foot |
| `cluAvailability` | String | No | `'Available'`, `'In-Process'`, `'Not Available'` |
| `nearbyRoadName` | String | No | Nearby road/milestone name |
| `latitude` | Number | No | GPS Latitude |
| `longitude` | Number | No | GPS Longitude |
| `files` | Binary | No | Up to 10 media files (Multipart upload) |

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Property created successfully!",
  "data": {
    "_id": "65b53cb1c98fe3a890f5c999",
    "propertyName": "New Garden Town",
    "zoneClassification": "Residential",
    "frontFacing": "South",
    "roadWidthFt": 30,
    "roadConnectivity": "Link Road",
    "lengthM": 40,
    "widthM": 25,
    "ratePerSqFt": 1200,
    "cluAvailability": "Available",
    "nearbyRoadName": "G.T. Road Extension",
    "latitude": 28.52,
    "longitude": 77.25,
    "mediaFiles": [
      "uploads/1706348912345-123456789.png"
    ],
    "createdAt": "2026-07-07T11:45:00.000Z",
    "updatedAt": "2026-07-07T11:45:00.000Z"
  }
}
```

---

### 5. Update Property
- **Endpoints**:
  - `PUT /api/properties/:id` (REST Standard)
  - `POST /api/properties/update/:id` (Alternative Route)
- **Authentication**: JWT Required
- **Content-Type**: `multipart/form-data` or `application/json`

#### Request Payload (Partial updates supported)
In addition to the standard fields above, you can specify files to delete:
- `deleteFiles`: Array of file paths (JSON serialized string if sending as multipart form data) to delete from disk.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Property updated successfully!",
  "data": {
    "_id": "65b53cb1c98fe3a890f5c123",
    "propertyName": "Updated Phase 1 Name",
    "zoneClassification": "Residential",
    "frontFacing": "East",
    "roadWidthFt": 40,
    "roadConnectivity": "Main Highway",
    "lengthM": 50,
    "widthM": 30,
    "ratePerSqFt": 1800,
    "cluAvailability": "Available",
    "nearbyRoadName": "G.T. Road",
    "latitude": 28.6139,
    "longitude": 77.209,
    "mediaFiles": [],
    "createdAt": "2026-07-07T05:42:06.000Z",
    "updatedAt": "2026-07-07T11:50:00.000Z"
  }
}
```

#### Error Response: Not Found (`404 Not Found`)
```json
{
  "success": false,
  "message": "Property not found"
}
```

---

### 6. Delete Property
- **Endpoints**:
  - `DELETE /api/properties/:id` (REST Standard)
  - `POST /api/properties/delete/:id` (Alternative Route)
- **Authentication**: JWT Required

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Property and its files deleted successfully!"
}
```

#### Error Response: Not Found (`404 Not Found`)
```json
{
  "success": false,
  "message": "Property not found"
}
```
