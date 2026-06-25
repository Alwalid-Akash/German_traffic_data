



Datenbanken und Web-Techniken
Final Project API Documentation
Summer Semester 2026



Faculty of Computer Science Professorship of Data Management



Md Al Walid
Matriculation Number: 812252



1. Introduction
1.1 Project Overview
AccidentInfoAPI is the backend service of the German Traffic Accident Analytics System. It provides a clean interface between the frontend application and the PostgreSQL database.
Instead of accessing the database directly, the frontend sends HTTP requests to the API. The API processes these requests, retrieves information from normalized database tables, and returns the results in JSON format.
This design improves:
Security
Maintainability
Reusability
Scalability
Separation of concerns

1.2 Purpose of the API
The API is responsible for:
Providing predefined questions to the frontend.
Supplying dropdown options such as years, states, and regions.
Answering accident-related analytical queries.
Supporting regional comparisons.
Performing cross-source calculations.
Explaining how database tables are used.

2. System Architecture
The application follows a three-layer architecture:
Presentation Layer (React Frontend)
API Layer (AccidentInfoAPI)
Database Layer (PostgreSQL)

Presentation Layer (React Frontend)

Purpose: User interface and client-side logic
Responsibilities:
User Interface: Renders interactive UI components for data visualization and analysis
State Management: Manages application state (user inputs, filtered data, UI states)
API Communication: Sends HTTP requests to the backend API
Data Visualization: Renders charts, maps, and tables for accident data
Form Handling: Manages user inputs (filters, search queries, selections)

API Layer (AccidentInfoAPI)
Purpose: Business logic, request handling, and data orchestration
Responsibilities:
Request Handling: Receives and processes HTTP requests from frontend
Business Logic: Implements accident analytics and calculations
Data Validation: Validates input parameters and query filters
Data Aggregation: Combines data from multiple sources
Response Formatting: Structures responses in JSON format
Error Handling: Manages and returns appropriate error responses

Database Layer (PostgreSQL)
Data Storage: Stores accident data, region information, and metadata
Data Integrity: Maintains relationships and constraints
Query Optimization: Provides efficient data retrieval
Data Aggregation: Handles complex analytical queries

Figure 1: System Architecture



3. API Overview
The API acts as an intermediary between the frontend and the database.
The frontend never communicates directly with PostgreSQL.
Correct Architecture
Frontend → AccidentInfoAPI → PostgreSQL
Incorrect Architecture
Frontend → PostgreSQL
Using a dedicated API layer ensures that all database operations are controlled and validated by the backend.

4. Relationship Between ETL and API
The ETL pipeline and the API are separate components.

Figure 2: System Architecture

Component
Responsibility
ETL pipeline
Downloads, transforms, and loads data
AccidentInfoAPI
Reads the database and answers questions




5. API Components
The API follows a modular design. Each file has a specific responsibility.

Figure 3: API Workflow

5.1 routes.js
Location
backend/src/api/routes.js
Purpose
This file defines all API endpoints.
Example:
GET /accidentinfoapi/answers/count
The route receives the request, invokes the query function, and returns a JSON response.
Role
routes.js = URL Controller

5.2 queries.js
Location
backend/src/api/queries.js
Purpose
This file contains the SQL logic used to answer questions.
Main database tables:
accidents
regions
indicators
indicator_values
Example function:
countAccidents()
This function supports filters such as:
year
state
region
bicycle
pedestrian
fatal
personal injury
Role
queries.js = Database Logic

5.3 catalog.js
Location
backend/src/api/catalog.js
Purpose
This file contains predefined questions shown in the frontend.
Each catalog item includes:
Question title
Description
Endpoint
Input fields
Fixed filters
Answer type
Role
catalog.js = Question Catalog

5.4 openapi.js
Location
backend/src/api/openapi.js
Purpose
This file generates OpenAPI documentation.
The OpenAPI specification describes:
Available endpoints
Request parameters
Response structures
Endpoint descriptions
Available at:
GET /accidentinfoapi/openapi.json
Role
openapi.js = API Documentation Generator

6. API Endpoints
The base URL is:
/accidentinfoapi

6.1 Metadata Endpoints



Purpose
Endpoint
API health check
GET /health
OpenAPI documentation
GET /openapi.json
Predefined questions
GET /question-catalog
Dataset coverage information
GET /metadata/coverage
Dropdown options
GET /metadata/options
Database table explanations
GET /schema-map











6.2 Region Endpoints

Endpoint
Purpose
GET /regions
List regions
GET /regions/{ags}
Retrieve region information






6.3 Answer Endpoints
Endpoint
Purpose
GET /answers/earliest-accident-year
Earliest year available
GET /answers/count
Count accidents
GET /answers/available-from
First year available for a state
GET /answers/passenger-car-rate
Accident rate per 100,000 passenger cars
GET /answers/top-fatal-districts
Ranking of fatal districts
GET /answers/zero-accident-municipalities
Municipalities without accidents



7. Endpoint Example
Count Endpoint
GET /accidentinfoapi/answers/count
Parameters

Parameter
Description
year
Accident year
stateAgs
Federal state code
regionName
Region name
bicycle
Bicycle accidents
pedestrian
Pedestrian accidents
fatal
Fatal accidents
personalInjury
Personal injury accidents












Example Request
GET /accidentinfoapi/answers/count?year=2024&regionName=Dresden&bicycle=true
Question answered:
How many bicycle accidents occurred in Dresden in 2024?

8. Required Question Mapping
Question
Endpoint
Tables Used
Earliest accident year
/answers/earliest-accident-year
accidents
Personal injury accidents in Saxony
/answers/count
accidents, regions
Pedestrian accidents in Berlin
/answers/count
accidents, regions
State availability year
/answers/available-from
accidents, regions
Passenger-car rate
/answers/passenger-car-rate
accidents, regions, indicators, indicator_values



9. Cross-Source Analytics
The passenger-car-rate query combines multiple datasets.
Dataset
Table
Unfallatlas
accidents
Regionalatlas
indicator_values
Indicator metadata
indicators
Regional hierarchy
regions






Formula:
Accidents per 100,000 passenger cars =
(accident_count ÷ passenger_cars) × 100,000
This demonstrates that the API supports multi-source analysis.

Figure 4: Cross-Source Query

10. Database Table Usage

Table
Purpose
accidents
Stores accident events
regions
Administrative hierarchy
indicators
Indicator definitions
indicator_values
Regional statistics
source_files
Data provenance
import_runs
ETL history









11. Input Validation and Error Handling
Supported HTTP status codes:
Code
Meaning
200
Success
400
Invalid request
404
Resource not found
500
Internal server error







12. Data Provenance
Data provenance information is stored in:
import_runs
source_files
These tables record:
ETL execution history
Source datasets
File origins
Import information

13. Data Licence Information
The system integrates official public datasets from:
Unfallatlas
GV-ISys / Destatis
Regionalatlas
The project does not claim ownership of the original datasets.

14. Testing the API
Start the backend:
npm run dev
Example requests:
curl "http://localhost:3000/accidentinfoapi/health"

curl "http://localhost:3000/accidentinfoapi/answers/earliest-accident-year"

curl "http://localhost:3000/accidentinfoapi/answers/count?year=2023&stateAgs=14&personalInjury=true"

curl "http://localhost:3000/accidentinfoapi/answers/count?year=2024&regionName=Dresden&bicycle=true"

15. System Summary

Requirement
Solution
No direct database access
Frontend uses AccidentInfoAPI
Normalized schema
regions, accidents, indicators, indicator_values
Required analytical questions
/answers endpoints
Cross-source query
passenger-car-rate
Zero-case analysis
zero-accident-municipalities
Documentation
OpenAPI and report
Reproducibility
import_runs and source_files

16. 





16. Conclusion
AccidentInfoAPI provides a structured and maintainable backend for traffic accident analytics.
The API separates the frontend from the database, validates user inputs, executes SQL queries on normalized tables, and returns JSON responses.
Together with the ETL pipeline, the system supports reproducible analytics, cross-source integration, and dynamic question answering. The modular architecture also makes the system easier to maintain, extend, and document.


17. References
[1] OpenGeoData NRW, "Unfallatlas - Official German Traffic Accident Data," OpenGeoData NRW. [Online]. Available: https://www.opengeodata.nrw.de/produkte/transport_verkehr/unfallatlas/. [Accessed: Jun. 2, 2026].

[2] Destatis, "GV-ISys - Official Administrative Region Reference," Statistisches Bundesamt. [Online]. Available: https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/. [Accessed: May.16, 2026].

[3] Regionalatlas, "Regionalatlas - Regional Statistical Indicators," Statistisches Bundesamt. [Online]. Available: https://regionalatlas.statistikportal.de/. [Accessed: Jun. 20, 2026].

[4] OpenAPI Initiative, "OpenAPI Specification," Version 3.0.3, 2020. [Online]. Available: https://swagger.io/specification/. [Accessed: Jun. 20, 2026].

[5] Express.js, "Express.js - Node.js Web Framework," Version 5.2.1. [Online]. Available: https://expressjs.com/. [Accessed: Jun. 2, 2026].

[6] PostgreSQL Global Development Group, "PostgreSQL - Relational Database," Version 14+. [Online]. Available: https://www.postgresql.org/. [Accessed: Jun. 20, 2026].



