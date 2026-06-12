# Healthcare App Backend & Database API Service

Production-ready backend API service implemented in Node.js, Express, and PostgreSQL using Sequelize ORM. Includes JWT session management with token rotation, numeric OTP verification, mock UIDAI Aadhaar verification flows, and Helmet/CORS security layers.

---

## 🛠️ Stack & Architecture
- **Server Framework**: Node.js & Express.js
- **Database Engine**: PostgreSQL
- **ORM & Migrations**: Sequelize
- **Security Compliance**: bcryptjs (password hashing), Helmet (header injection), CORS filters, IP Rate Limiter
- **Logs**: Winston logger writing to `logs/combined.log` and `logs/error.log`

---

## 🚀 Running the Project

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL database running locally

### Local Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Configure your local settings inside the `.env` file (Database name, username, and password).
4. Run Sequelize database migrations and seeds:
   ```bash
   # Run table creation migrations
   npx sequelize-cli db:migrate
   
   # Inject sample patients, doctors, and appointment seeds
   npx sequelize-cli db:seed:all
   ```
5. Boot the server in development mode (watches for files changes using nodemon):
   ```bash
   npm run dev
   ```

### Running with Docker Compose
If you prefer running the stack inside isolated Docker containers:
```bash
# Boot Postgres DB container and Node.js App container
docker-compose up --build
```
This automatically maps port `5000` to the Express API and port `5432` to the Postgres database volume.

---

## 📑 API Endpoints Specification

### 1. Authentication (`/api/auth`)
* **`POST /api/auth/register`**
  * Registers a new patient or doctor, hashes the password, and logs them in.
  * *Request Body*:
    ```json
    {
      "name": "Khushwant Singh",
      "email": "khushwant@example.com",
      "phone": "+918888888888",
      "password": "Password123!",
      "role": "patient",
      "bloodGroup": "O+",
      "dateOfBirth": "1995-08-20"
    }
    ```
* **`POST /api/auth/login`**
  * *Request Body*:
    ```json
    { "email": "doctor@livelong.com", "password": "password123" }
    ```
* **`POST /api/auth/send-otp`**
  * Generates and logs a 6-digit numeric login code.
  * *Request Body*:
    ```json
    { "phone": "+918888888888", "purpose": "login" }
    ```
* **`POST /api/auth/verify-otp`**
  * Validates code. If purpose is `login`, logs the user in and returns token sets.
  * *Request Body*:
    ```json
    { "phone": "+918888888888", "otp": "123456", "purpose": "login" }
    ```
* **`POST /api/auth/refresh-token`**
  * Rotates refresh tokens to prevent replay attacks.
  * *Request Body*:
    ```json
    { "refreshToken": "jwt-refresh-token-string" }
    ```
* **`POST /api/auth/logout`**
  * Revokes the active refresh token.
  * *Request Header*: `Authorization: Bearer <access_token>`
  * *Request Body*:
    ```json
    { "refreshToken": "jwt-refresh-token-string" }
    ```

### 2. Aadhaar Verification (`/api/aadhaar`)
*All routes require Bearer authentication header.*
* **`POST /api/aadhaar/send-otp`**
  * *Request Body*:
    ```json
    { "aadhaarNumber": "123456789012" }
    ```
  * *Response*: Returns a unique `transactionId` reference and generates a simulated SMS OTP in the logs.
* **`POST /api/aadhaar/verify-otp`**
  * *Request Body*:
    ```json
    { "transactionId": "TXN-AADHAAR-ABC1234", "otp": "654321" }
    ```
  * *Response*: Marks user `isAadhaarVerified: true`, records an audit log, and saves the secure SHA-256 hash of the Aadhaar.

### 3. Profile & Document Uploads (`/api/users`)
*All routes require Bearer authentication header.*
* **`GET /api/users/profile`**
  * Retrieves profile metadata matching the logged-in role.
* **`PUT /api/users/profile`**
  * Updates profile and user detail columns inside a transaction.
* **`POST /api/users/medical-records`**
  * Uploads health reports or prescriptions securely.
  * *Request Content*: `multipart/form-data` with field `document` (limit 10MB, PDF/PNG/JPEG only) and text fields `title`, `recordType`, and `description`.
