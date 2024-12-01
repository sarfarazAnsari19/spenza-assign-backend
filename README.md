# Webhooks Processing Service

This repository is designed to handle webhooks efficiently and provide a scalable, maintainable structure for processing incoming events. Below is a detailed overview of the project, the design choices made, and how to set up the environment.

---

## Table of Contents

1. [Overview](#overview)  
2. [Getting Started](#getting-started)  
3. [Running the Application](#running-the-application)  

---

## Overview

This service provides a framework for handling webhook events. It processes incoming requests, validates payloads, and executes business logic based on event types. The application is built with **Node.js**, **Express.js**, and **MongoDB**, ensuring speed and reliability.

---

## Getting Started

### Prerequisites
1. **Node.js**: Install [Node.js](https://nodejs.org/) (v16 or later).
2. **MongoDB**: Install [MongoDB](https://www.mongodb.com/try/download/community) and ensure it is running locally.
3. **MongoDB Compass**: Use [MongoDB Compass](https://www.mongodb.com/products/compass) to visualize and manage the database.

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/webhooks-service.git
   cd webhooks-service
   npm install
   ```
2. Create a .env file in the root directory and add:
   ```
   PORT=3001
   SECRET_KEY=ABCDEFGHIJKLMNOPQRSTUVWXYZ
   MONGO_URI=mongodb://localhost:27017/webhooks
   ```
3. run
   ```
   npm run devStart
   ```
   
