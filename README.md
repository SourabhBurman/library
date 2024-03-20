# Library Backend

This project serves as the backend for the Library, allowing customers to browse and purchase books online.

## Features

- User authentication and authorization with JWT tokens
- CRUD operations for managing books
- Placing orders and viewing order history
- Proper error handling and validation

## Technologies Used

- Node.js
- Express.js
- MongoDB (Mongoose ODM)
- JSON Web Tokens (JWT) for authentication

## Getting Started

To get started with the project, follow these steps:

1. Clone this repository to your local machine.

2. Install dependencies using npm:

Set up environment variables:

Create a .env file in the root directory.

Define the following environment variables:

PORT=<port_number>
mongoURL=<mongodb_connection_string>
Start the server:


## API Documentation

### Authentication
Register User
URL: /api/register
Method: POST
Request Body:
json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "isAdmin": false
}


### User Login
URL: /api/login
Method: POST
Request Body:
json
{
  "email": "john@example.com",
  "password": "password123"
}

## Books
### Get All Books
URL: /api/books
Method: GET
Success Response:

### Get Book by ID
URL: /api/books/:id
Method: GET

### Add New Book
URL: /api/books
Method: POST
Request Body:
json
{
  "title": "Book Title",
  "author": "Author Name",
  "category": "Fiction",
  "price": 20.99,
  "quantity": 10
}

### Update Book
URL: /api/books/:id
Method: PATCH
Request Body:
json
{
  "title": "Book Title",
  "author": "Author Name",
  "category": "Fiction",
  "price": 20.99,
  "quantity": 10
}


### Delete Book
URL: /api/books/:id
Method: DELETE


## Orders
### Place Order
URL: /api/order
Method: POST
Request Body:
json
Copy code
{
  "books": ["book_id1", "book_id2"],
  "totalAmount": 41.98
}

### Get All Orders
URL: /api/orders
Method: GET

