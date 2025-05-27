# Backend API Documentation

This document provides comprehensive documentation for the backend API of the RAHEL project. The API serves as the server-side component for a marketplace application, handling user authentication, product management, transactions, and messaging.

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Getting Started](#getting-started)
3. [Cloud Deployment](#cloud-deployment)
4. [Database Models](#database-models)
5. [API Endpoints](#api-endpoints)
   - [API Status](#api-status)
   - [Authentication](#authentication)
   - [User Management](#user-management)
   - [Product Management](#product-management)
   - [Transaction Management](#transaction-management)
6. [Error Handling](#error-handling)
7. [Authentication Flow](#authentication-flow)

## Environment Setup

Create a `.env` file in the backend directory with the following variables:

```
# Database Configuration
_DB_NAME=your_database_name
_DB_USER=your_database_user
_DB_PASS=your_database_password
_DB_HOST=your_database_host

# Authentication
_ACCESS_TOKEN_SECRET=your__ACCESS_TOKEN_SECRET
_REFRESH_TOKEN_SECRET=your__REFRESH_TOKEN_SECRET

# Server Configuration
PORT=5000
_CORS_ORIGIN=http://localhost:3000
```

## Getting Started

1. **Install Dependencies**

   ```bash
   pnpm install
   ```

2. **Run Development Server**

   ```bash
   pnpm run dev
   ```

3. **Start Production Server**

   ```bash
   pnpm start
   ```

## Cloud Deployment

For Google Cloud Run deployment, ensure you:

1. Set proper environment variables in the Cloud Build configuration. **Important:** Database credentials (`_DB_HOST`, `_DB_USER`, `_DB_PASS`) must be updated to point to your cloud database instance, not `localhost`.
2. Use PORT environment variable (provided by Cloud Run) for your application to listen on `0.0.0.0`
3. Configure database connection for cloud environment
4. Set appropriate memory and CPU limits

The application will automatically use Cloud Run's PORT environment variable when deployed.

## Database Models

The application uses the following main models:

### User Model

Users in the system, including authentication data and profile information.

```javascript
{
  user_id: Integer (Primary Key, Auto Increment),
  email: String (Unique, Required),
  password: String (Required, Hashed),
  name: String (Required),
  phone_number: String,
  profile_picture: String,
  created_at: DateTime,
  updated_at: DateTime
}
```

### Barang (Product) Model

Products or items listed by users for sale, exchange, or donation.

```javascript
{
  item_id: Integer (Primary Key, Auto Increment),
  user_id: Integer (Foreign Key to User),
  item_name: String (Required),
  description: Text,
  category: String,
  price: Decimal(10,2),
  condition: String,
  status: Enum ["available", "sold", "donated", "exchanged"],
  location: String,
  image_url: String,
  date_posted: DateTime,
  created_at: DateTime,
  updated_at: DateTime
}
```

### Transaksi (Transaction) Model

Records of transactions between users for products.

```javascript
{
  transaction_id: Integer (Primary Key, Auto Increment),
  item_id: Integer (Foreign Key to Barang),
  buyer_id: Integer (Foreign Key to User),
  seller_id: Integer (Foreign Key to User),
  transaction_date: DateTime,
  quantity: Integer,
  total_price: Decimal(10,2),
  status: Enum ["pending", "completed", "cancelled"],
  payment_method: String,
  shipping_address: Text,
  created_at: DateTime,
  updated_at: DateTime
}
```

## API Endpoints

### API Status

- **GET /api-status**
  - Description: Check if the API is running
  - Response: `{ "status": "Server is running", "timestamp": "ISO DateTime" }`

### Authentication

- **POST /auth/register**
  - Description: Register a new user
  - Request Body:
    ```json
    {
      "email": "user@example.com",
      "password": "secure-password",
      "name": "User Name",
      "phone_number": "08123456789",
      "profile_picture": "https://example.com/avatar.jpg"
    }
    ```
  - Response: `{ "msg": "Register berhasil" }`

- **POST /auth/login**
  - Description: User login
  - Request Body:
    ```json
    {
      "email": "user@example.com",
      "password": "secure-password"
    }
    ```
  - Response:
    ```json
    {
      "accessToken": "jwt-access-token",
      "refreshToken": "jwt-refresh-token",
      "user": {
        "user_id": 1,
        "name": "User Name",
        "email": "user@example.com",
        "phone_number": "08123456789",
        "profile_picture": "https://example.com/avatar.jpg"
      }
    }
    ```

- **POST /auth/refresh-token**
  - Description: Refresh access token using refresh token
  - Request Body: `{ "refreshToken": "refresh-token-value" }`
  - Response: `{ "accessToken": "new-jwt-access-token" }`

- **POST /auth/logout**
  - Description: Logout user
  - Request Body: `{ "refreshToken": "refresh-token-value" }`
  - Response: `{ "msg": "Logout berhasil" }`

### User Management

- **GET /api/users/me**
  - Description: Get current user profile
  - Authentication: Required
  - Response: User object without password

- **PUT /api/users/me**
  - Description: Update current user profile
  - Authentication: Required
  - Request Body: 
    ```json
    {
      "email": "new-email@example.com",
      "name": "New Name",
      "phone_number": "08987654321",
      "profile_picture": "https://example.com/new-avatar.jpg",
      "current_password": "current-password", 
      "new_password": "new-password" 
    }
    ```
  - Response: `{ "msg": "Profil berhasil diupdate" }`

### Product Management

- **GET /api/barang**
  - Description: Get list of products
  - Query Parameters:
    - `search`: Search by name
    - `category`: Filter by category
    - `status`: Filter by status
    - `minPrice`: Minimum price
    - `maxPrice`: Maximum price
    - `sortBy`: Field to sort by
    - `order`: Sort order (ASC/DESC)
  - Response: Array of product objects

- **GET /api/barang/me**
  - Description: Get products listed by current user
  - Authentication: Required
  - Query Parameters:
    - `status`: Filter by status
  - Response: Array of product objects

- **GET /api/barang/:item_id**
  - Description: Get product by ID
  - Response: Product object with seller details

- **POST /api/barang**
  - Description: Create new product
  - Authentication: Required
  - Request Body: 
    ```json
    {
      "item_name": "Item Name",
      "description": "Item Description",
      "category": "Category Name",
      "price": 100000,
      "condition": "New/Used",
      "location": "City Name",
      "image_url": "https://example.com/image.jpg",
      "status": "available"
    }
    ```
  - Response: `{ "msg": "Barang berhasil ditambahkan", "data": {...} }`

- **PUT /api/barang/:item_id**
  - Description: Update product
  - Authentication: Required
  - Request Body: Any product fields to update
  - Response: `{ "msg": "Barang berhasil diupdate", "data": {...} }`

- **DELETE /api/barang/:item_id**
  - Description: Delete product
  - Authentication: Required
  - Response: `{ "msg": "Barang berhasil dihapus" }`

### Transaction Management

- **GET /api/transaksi**
  - Description: Get transactions for current user
  - Authentication: Required
  - Query Parameters:
    - `type`: "purchase" or "sale"
  - Response: Array of transaction objects

- **GET /api/transaksi/:transaction_id**
  - Description: Get specific transaction
  - Authentication: Required
  - Response: Transaction object with related data

- **POST /api/transaksi**
  - Description: Create new transaction
  - Authentication: Required
  - Request Body: 
    ```json
    {
      "item_id": 1,
      "quantity": 1,
      "payment_method": "Cash on Delivery",
      "shipping_address": "Shipping Address",
      "customerInfo": {
        "address": "Alternative Address",
        "paymentMethod": { "name": "Payment Method" }
      }
    }
    ```
  - Response: `{ "msg": "Transaksi berhasil dibuat", "data": {...} }`

- **PUT /api/transaksi/:transaction_id**
  - Description: Update transaction status
  - Authentication: Required
  - Request Body: `{ "status": "pending|completed|cancelled" }`
  - Response: `{ "msg": "Transaksi berhasil diupdate", "data": {...} }`

- **DELETE /api/transaksi/:transaction_id**
  - Description: Delete transaction
  - Authentication: Required
  - Response: `{ "msg": "Transaksi berhasil dihapus" }`

## Error Handling

The API provides standardized error responses:

- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Server Error**: Internal server error

Error responses follow this format:
```json
{
  "msg": "Error message description"
}
```

## Authentication Flow

1. **Registration**: User registers and account is created
2. **Login**: User logs in with credentials and receives access token and refresh token
3. **API Requests**: Access token is included in the Authorization header as a Bearer token
4. **Token Expiry**: When access token expires, use refresh token to get a new access token
5. **Logout**: Invalidate the refresh token

### Token Usage Example

```javascript
// API request with authentication
fetch('http://localhost:5000/api/users/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
})
```
