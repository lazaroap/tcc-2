# Swagger API Documentation

This project provides a RESTful API documented using Swagger (OpenAPI). The API documentation is generated from the OpenAPI specification defined in the `openapi.yaml` file.

## Project Structure

The project is organized as follows:

```
swagger-api-docs
├── src
│   ├── app.js               # Entry point of the application
│   ├── routes
│   │   └── index.js         # API routes definition
│   ├── docs
│   │   ├── openapi.yaml      # OpenAPI specification
│   │   └── swagger.js        # Swagger UI setup
│   └── controllers
│       └── index.js         # Controller functions for API endpoints
├── package.json              # npm configuration file
├── .env.example              # Example environment variables
└── README.md                 # Project documentation
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd swagger-api-docs
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Environment Variables:**
   Copy the `.env.example` file to `.env` and update the values as needed.

4. **Run the application:**
   ```
   npm start
   ```

5. **Access the API documentation:**
   Open your browser and navigate to `http://localhost:3000/api-docs` to view the Swagger UI.

## Usage Guidelines

- The API endpoints are defined in the `src/routes/index.js` file.
- Business logic for the endpoints is handled in the `src/controllers/index.js` file.
- The OpenAPI specification is located in `src/docs/openapi.yaml`. You can modify this file to update the API documentation.
- The Swagger UI is set up in `src/docs/swagger.js`, which serves the documentation based on the OpenAPI specification.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.