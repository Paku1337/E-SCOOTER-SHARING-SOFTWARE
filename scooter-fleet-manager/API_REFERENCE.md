# 📡 API Reference - Scooter Fleet Manager

## Base URL

```
Production:  https://your-app-name.fly.dev/api
Development: http://localhost:3001/api
```

## Authentication

Wszystkie endpoints (poza `/auth`) wymagają headera:

```
Authorization: Bearer <JWT_TOKEN>
```

JWT token jest ważny przez 24 godziny.

---

## 🔐 Auth Endpoints

### Register

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "fullName": "John Doe",
  "role": "client"  // admin | service | client
}
```

**Response 201:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "client",
    "full_name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response 200:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "client",
    "full_name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## 🛴 Scooters Endpoints

### Get All Scooters

```http
GET /scooters?status=available&spotId=1
Authorization: Bearer <TOKEN>
```

**Query Parameters:**
- `status` - available | in_use | maintenance | charging | damaged | decommissioned
- `spotId` - Filter by parking spot

**Response 200:**
```json
[
  {
    "id": 1,
    "device_id": "SC-001",
    "name": "Scooter 001",
    "model": "OMNI OT303BL",
    "serial_number": "SN001",
    "imei": "352625333222001",
    "latitude": 52.2297,
    "longitude": 21.0122,
    "battery_level": 85,
    "status": "available",
    "speed_mode": null,
    "total_mileage": 125.50,
    "current_spot_id": 1,
    "last_update": "2026-04-10T10:30:00Z",
    "flespi_channel_id": "1001",
    "is_lost": false,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-04-10T10:30:00Z"
  }
]
```

### Get Single Scooter

```http
GET /scooters/:id
Authorization: Bearer <TOKEN>
```

**Response 200:** Single scooter object (jak wyżej)

### Create Scooter (Admin)

```http
POST /scooters
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "deviceId": "SC-007",
  "name": "Scooter 007",
  "model": "OMNI OT303BL",
  "serialNumber": "SN007",
  "imei": "352625333222007",
  "flespiChannelId": "1007"
}
```

**Response 201:** Newly created scooter

### Update Scooter Status

```http
PATCH /scooters/:id/status
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "status": "maintenance"
}
```

**Valid statuses:**
- available
- in_use
- maintenance
- charging
- damaged
- decommissioned

**Response 200:** Updated scooter

### Mark Scooter as Lost (Admin/Service)

```http
POST /scooters/:id/mark-lost
Authorization: Bearer <ADMIN_OR_SERVICE_TOKEN>
```

**Response 200:**
```json
{
  "id": 1,
  "is_lost": true,
  "status": "maintenance",
  "updated_at": "2026-04-10T10:35:00Z"
}
```

### Get Scooter Telemetry

```http
GET /scooters/:id/telemetry
Authorization: Bearer <TOKEN>
```

**Response 200:**
```json
{
  "device_id": "SC-001",
  "latitude": 52.2297,
  "longitude": 21.0122,
  "battery_level": 85,
  "speed": 0,
  "lock_status": true,
  "movement_status": false,
  "timestamp": 1680000000
}
```

### Send Command to Scooter (Admin/Service)

```http
POST /scooters/:id/command
Authorization: Bearer <ADMIN_OR_SERVICE_TOKEN>
Content-Type: application/json

{
  "instructionType": "S6",
  "payload": ""
}
```

**Available Instruction Types:**
- `D0` - Get positioning (single time)
- `D1` - Set positioning interval
- `L0` / `L1` - Lock/Unlock
- `R0` - Lock/Unlock request
- `S4` - Scooter settings 2
- `S5` - IoT device settings
- `S6` - Get scooter info
- `S7` - Scooter settings 1
- `V0` - Beep playback
- `V1` - Beep settings

**Response 200:** Command result from Flespi

---

## 📍 Spots Endpoints

### Get All Spots

```http
GET /spots
Authorization: Bearer <TOKEN>
```

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "Central Station",
    "description": "Main parking spot near train station",
    "latitude": 52.2297,
    "longitude": 21.0122,
    "capacity": 50,
    "current_scooters": 12,
    "address": "Centralna 1, Warszawa",
    "area_radius": 100,
    "status": "active",
    "created_by": 1,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-04-10T10:30:00Z"
  }
]
```

### Get Spot with Scooters

```http
GET /spots/:id
Authorization: Bearer <TOKEN>
```

**Response 200:**
```json
{
  "id": 1,
  "name": "Central Station",
  ...
  "scooters": [
    { "id": 1, "name": "SC-001", ... },
    { "id": 2, "name": "SC-002", ... }
  ],
  "scooters_count": 2
}
```

### Create Spot (Admin)

```http
POST /spots
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "name": "New Spot",
  "description": "Description",
  "latitude": 52.2297,
  "longitude": 21.0122,
  "capacity": 30,
  "address": "Street 1, City",
  "areaRadius": 100
}
```

**Response 201:** Newly created spot

### Update Spot (Admin)

```http
PATCH /spots/:id
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "name": "Updated Name",
  "capacity": 40,
  "status": "inactive"
}
```

**Response 200:** Updated spot

### Delete Spot (Admin)

```http
DELETE /spots/:id
Authorization: Bearer <ADMIN_TOKEN>
```

**Requirements:** Spot must not have any scooters

**Response 200:**
```json
{
  "message": "Spot deleted successfully"
}
```

---

## ⚡ Tasks Endpoints

### Get All Tasks

```http
GET /tasks?status=pending&type=rebalance&assignedTo=1
Authorization: Bearer <TOKEN>
```

**Query Parameters:**
- `status` - pending | assigned | in_progress | completed | failed | cancelled
- `type` - rebalance | collect | deploy | lost
- `assignedTo` - User ID
- `scooterId` - Scooter ID

**Response 200:**
```json
[
  {
    "id": 1,
    "scooter_id": 1,
    "task_type": "rebalance",
    "status": "pending",
    "priority": "normal",
    "from_spot_id": 1,
    "to_spot_id": 2,
    "assigned_to": 2,
    "description": "Move to Park Łazienki",
    "details": null,
    "completed_at": null,
    "created_at": "2026-04-10T10:30:00Z",
    "updated_at": "2026-04-10T10:30:00Z"
  }
]
```

### Create Task (Admin/Service)

```http
POST /tasks
Authorization: Bearer <ADMIN_OR_SERVICE_TOKEN>
Content-Type: application/json

{
  "scooterId": 1,
  "taskType": "rebalance",
  "priority": "normal",
  "description": "Move to different spot",
  "fromSpotId": 1,
  "toSpotId": 2,
  "details": {
    "notes": "Check battery first"
  }
}
```

**Task Types:**
- `rebalance` - Move scooter to different spot
- `collect` - Collect for maintenance
- `deploy` - Deploy to new location
- `lost` - Mark as lost

**Priorities:**
- normal
- high
- urgent

**Response 201:** Newly created task

### Assign Task (Admin/Service)

```http
PATCH /tasks/:id/assign
Authorization: Bearer <ADMIN_OR_SERVICE_TOKEN>
Content-Type: application/json

{
  "userId": 2
}
```

**Response 200:** Updated task with status "assigned"

### Update Task Status

```http
PATCH /tasks/:id/status
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "status": "in_progress"
}
```

**Response 200:** Updated task

### Get My Tasks (Service Workers)

```http
GET /tasks/my-tasks
Authorization: Bearer <SERVICE_TOKEN>
```

**Response 200:** Array of assigned tasks (excluding completed)

### Task Statistics

```http
GET /tasks/stats/overview
Authorization: Bearer <TOKEN>
```

**Response 200:**
```json
{
  "pending_tasks": 5,
  "in_progress_tasks": 2,
  "completed_tasks": 18,
  "rebalance_count": 3,
  "collect_count": 2,
  "deploy_count": 4,
  "lost_count": 0
}
```

---

## 💳 Billing Endpoints

### Get Billing Records

```http
GET /billing?userId=1&status=pending
Authorization: Bearer <TOKEN>
```

**Query Parameters:**
- `userId` - Filter by user (non-admin can only see their own)
- `status` - pending | paid
- `type` - Filter by type

**Response 200:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "scooter_id": 1,
    "amount": 49.99,
    "type": "rental",
    "description": "Monthly subscription",
    "status": "pending",
    "payment_date": null,
    "due_date": "2026-05-10T00:00:00Z",
    "metadata": null,
    "created_at": "2026-04-10T10:30:00Z"
  }
]
```

### Get User Billing Summary

```http
GET /billing/summary/user/:userId
Authorization: Bearer <TOKEN>
```

**Response 200:**
```json
{
  "total_records": 5,
  "pending_count": 3,
  "paid_count": 2,
  "total_pending": 149.97,
  "total_paid": 99.98,
  "total_amount": 249.95
}
```

### Create Billing Record (Admin)

```http
POST /billing
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "userId": 1,
  "scooterId": 1,
  "amount": 49.99,
  "type": "rental",
  "description": "Monthly subscription",
  "dueDate": "2026-05-10T00:00:00Z",
  "metadata": {
    "billingPeriod": "2026-04-01 to 2026-04-30"
  }
}
```

**Response 201:** Newly created record

### Mark as Paid

```http
PATCH /billing/:id/mark-paid
Authorization: Bearer <TOKEN>
```

**Response 200:**
```json
{
  "id": 1,
  "status": "paid",
  "payment_date": "2026-04-10T10:35:00Z"
}
```

### Billing Dashboard Stats (Admin)

```http
GET /billing/stats/dashboard
Authorization: Bearer <ADMIN_TOKEN>
```

**Response 200:**
```json
{
  "total_records": 50,
  "pending_records": 20,
  "paid_records": 30,
  "total_pending_amount": 999.80,
  "total_paid_amount": 1999.70,
  "average_amount": 40.00,
  "unique_users": 15
}
```

---

## 👥 Admin Endpoints

### Get All Users (Admin)

```http
GET /admin/users?role=service&status=active
Authorization: Bearer <ADMIN_TOKEN>
```

**Query Parameters:**
- `role` - admin | service | client
- `status` - active | inactive | suspended | deleted

**Response 200:**
```json
[
  {
    "id": 1,
    "email": "admin@fleet.com",
    "full_name": "Admin User",
    "role": "admin",
    "status": "active",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-04-10T10:30:00Z"
  }
]
```

### Update User Role (Admin)

```http
PATCH /admin/users/:id/role
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "role": "service"
}
```

**Valid roles:**
- admin
- service
- client

**Response 200:** Updated user

### Update User Status (Admin)

```http
PATCH /admin/users/:id/status
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "status": "suspended"
}
```

**Valid statuses:**
- active
- inactive
- suspended
- deleted

**Response 200:** Updated user

### Get Audit Logs (Admin)

```http
GET /admin/audit-logs?userId=1&action=MARK_LOST&limit=50
Authorization: Bearer <ADMIN_TOKEN>
```

**Query Parameters:**
- `userId` - Filter by user
- `action` - Filter by action (substring match)
- `limit` - Number of records (default 50)

**Response 200:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "action": "MARK_LOST",
    "entity_type": "scooter",
    "entity_id": 5,
    "changes": null,
    "ip_address": "127.0.0.1",
    "created_at": "2026-04-10T10:30:00Z"
  }
]
```

### Get System Statistics (Admin)

```http
GET /admin/stats
Authorization: Bearer <ADMIN_TOKEN>
```

**Response 200:**
```json
{
  "total_users": 50,
  "admin_count": 2,
  "service_count": 10,
  "client_count": 38,
  "total_scooters": 100,
  "available_scooters": 65,
  "in_use_scooters": 30,
  "lost_scooters": 2,
  "total_spots": 8,
  "pending_tasks": 12,
  "in_progress_tasks": 5,
  "completed_tasks": 45,
  "pending_revenue": 1500.00,
  "paid_revenue": 5000.00
}
```

---

## ❌ Error Responses

### 400 Bad Request

```json
{
  "error": "Email and password required"
}
```

### 401 Unauthorized

```json
{
  "error": "Invalid token"
}
```

### 403 Forbidden

```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found

```json
{
  "error": "Scooter not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal Server Error"
}
```

---

## 🔄 Rate Limiting

Endpoints są chronione przed abuse:

- Login: 5 prób na 15 minut
- API: 100 żądań na godzinę per token

---

## 📊 Data Types

### Task Status
- `pending` - Newly created
- `assigned` - Assigned to worker
- `in_progress` - Currently being worked on
- `completed` - Task finished
- `failed` - Task failed
- `cancelled` - Task cancelled

### Scooter Status
- `available` - Ready to use
- `in_use` - Currently in use
- `maintenance` - In maintenance
- `charging` - Currently charging
- `damaged` - Damaged
- `decommissioned` - No longer in use

### Billing Status
- `pending` - Not paid
- `paid` - Payment received

### User Role
- `admin` - Full system access
- `service` - Manage tasks and scooters
- `client` - Limited access to own records

### User Status
- `active` - Account active
- `inactive` - Account inactive
- `suspended` - Account suspended
- `deleted` - Account deleted

---

## 🚀 Example Workflows

### Workflow 1: Create and Assign Task

```bash
# 1. Create task
curl -X POST http://localhost:3001/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scooterId": 1,
    "taskType": "rebalance",
    "fromSpotId": 1,
    "toSpotId": 2
  }'

# Response: { "id": 42, "status": "pending", ... }

# 2. Assign to worker
curl -X PATCH http://localhost:3001/api/tasks/42/assign \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": 3}'

# Response: { "id": 42, "status": "assigned", "assigned_to": 3, ... }

# 3. Worker gets their tasks
curl http://localhost:3001/api/tasks/my-tasks \
  -H "Authorization: Bearer $WORKER_TOKEN"

# 4. Worker updates status
curl -X PATCH http://localhost:3001/api/tasks/42/status \
  -H "Authorization: Bearer $WORKER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}'

# 5. Complete task
curl -X PATCH http://localhost:3001/api/tasks/42/status \
  -H "Authorization: Bearer $WORKER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

---

**Ostatnia aktualizacja:** 2026-04-10  
**Wersja API:** 1.0.0
