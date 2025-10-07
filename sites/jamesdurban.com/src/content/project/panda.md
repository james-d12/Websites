---
title: Panda
publishDate: 2023-04-01 00:00:00
img: /assets/panda.png
img_alt: A bright pink sheet of paper used to wrap flowers curves in front of rich blue background
skills:
  - Backend
  - Frontend
  - Database
  - REST API
github: private
---

# Overview

Panda is a financial planning and analysis web application built from the ground up to address the required business needs to track and manage budgets across all sectors of the business.

I worked with the Finance Team, I.T team and my manager to take it from the design phase all the way to the delivery phase. I used the agile methodology which allowed the development to respond more rapidly to the ever growing changes and needs of the product as it's requirements were not set in stone.

# How was it built?

When the project initially began, I used tools such as [DBDesigner.Net](https://www.dbdesigner.net/) to sketch up initial database designs and used GitHub's issues and projects feature to plan out milestones and tasks that would need to be completed for each phase.

In the beginning, the project started more unstructured as we began the process towards a prototype / skeleton of what the web application would turn out to be. Once the shape and vision of the website was more set in stone we moved towards an agile development process where every 4 - 8 weeks we released features and cycled between bug fixes and features.

Panda was separated into 2 modules the backend and the frontend. The backend focused on containing the business logic, connecting to external databases and providing a rest api for allowing the frontend to perform actions.

## Backend

- **TypeScript** used as the primary language with strict defaults.
- **Express.js** used as the server library for handling api requests and responses.
- **Prisma.io** was used as the ORM layer to abstract away SQL operations to the database.
- **SQLite** was used as the primary database for storing Panda data.
- **Zod** was used as the main form of schema validation. It was used to validate requests and responses from Express.js and to ensure any data types matched a given schema.
- **Microsoft SQL** was used for querying external databases within the company.
- **Active Directory** was integrated to authenticate user's credentials.
- **Jest** and **Supertest** where used for unit and endpoint testing.
- **Postman** was used as well for testing requests.
- **Swagger** was used to document endpoints.
- **TypeDoc** was used to generate documentation from TSDOC compliant comments.

## Frontend

- **React.js** & **TypeScript** were used as the main language + library.
- **Tabulator.js** was used for the tables to include sorting, filtering and advanced row / column calculations.
- **Material UI** was used as the main component library to assist with styling and UI.
- **Zod** and **Formik** used for validation and allowing users to input certain data typically used to send to the REST API.

# What big challenges did I overcome?

There were a lot of big challenges that propped up during the design and development stages of Panda.

## Database

One of these challenges involved the design of the database for storing tabular information such as Cells, Rows and Columns. The first and still in use approach that was used was the following database design.
