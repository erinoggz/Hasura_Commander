#UTIL Hasura Table Tracker

This app drops and set source, set hasura permissions, set webhook configs, tracks tables/relationships on hasura.

## Prerequisites

- **Node.js** and **TypeScript** installed.
- **Hasura URL** and **Admin Secret**: The Hasura instance URL and admin secret are required for authentication.
- **YAML Metadata File**: The `metadata.yml` file should be present in the project directory. A sample metadata is located in utils folder

## Setup Instructions

**Install dependencies**: Run `yarn` to install required packages.

## Usage

To run the script, use the following command:
```bash
npx ts-node app.ts -e <HASURA_URL> -s <HASURA_ADMIN_SECRET> -f utils/metadata.yml
```
