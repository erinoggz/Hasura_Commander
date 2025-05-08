# 🚀 Hasura Commander

A developer utility for automating Hasura metadata configuration. This tool drops and resets sources, tracks tables and relationships, sets permissions, and configures webhooks — all via code.

## 📌 Overview

**Hasura Commander** is designed to simplify and standardize the setup of Hasura GraphQL instances across environments. Rather than manually configuring metadata in the Hasura Console, this tool enables you to manage your metadata using version-controlled YAML and run it through a simple script.

### ✅ Features
- Drop and set data sources
- Track tables and define relationships
- Configure environment-based webhooks
- Set permissions programmatically
- Load and apply YAML-based metadata
- Designed for CI/CD and team workflows

---

## 🧰 Prerequisites

- **Node.js** and **TypeScript** installed
- **Hasura URL** and **Admin Secret** for authentication
- `metadata.yml` file present in the root directory  
  _A sample file is available in the `utils/` folder_

---

## ⚙️ Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/erinoggz/Hasura_Commander.git
   cd Hasura_Commander


## Usage

To run the script, use the following command:
```bash
npx ts-node app.ts -e <HASURA_URL> -s <HASURA_ADMIN_SECRET> -f utils/metadata.yml
```
## 🤝 Contributions

Pull requests, issues, and discussions are welcome.  
If you have ideas for improving Hasura metadata automation or CI-friendly enhancements, feel free to contribute!

## 📄 License

This project is licensed under the [MIT License](LICENSE).

