# **SnapToApp Frontend Admin**

## **Introduction**
SnapToApp Frontend Admin is a **React-based** frontend application for managing app configurations, subscriptions, and user interactions. It is built with **TypeScript**, **Vite**, and **Tailwind CSS**, and utilizes **React Query** for data fetching and state management.

This project is designed as the **admin panel** for managing Progressive Web Apps (PWAs) built using SnapToApp.

---

## **Getting Started**

### **Pre-requisites**
Before running the frontend repository, ensure you have the following installed:

- **Node.js** (>= 16.x)
- **npm** (>= 8.x) or **Yarn** (optional)
- **Vite** (bundler)
- **TypeScript** (>= 4.x)

---

## **Setup & Installation**

### **Clone the Repository**
```sh
git clone https://<your-bitbucket-username>@bitbucket.org/hoolisoftware/snaptoapp-frontend-admin.git
cd snaptoapp-frontend-admin
```

### **Install Dependencies**
```sh
npm i
```

### **Environmental Variables**
Before running the project, ensure you have the necessary environment variables set up. These variables are required for API communication, authentication, and third-party services.
```sh
VITE_API_URL=https://dapi.snaptoapp.com  # Production API URL
VITE_API_URL=http://localhost:9000       # Local Development API URL
VITE_ENVIRONMENT=development             # Environment type (development/staging/production)
```
### **Setup for Local Development**
For running the project locally, follow these steps:
1. Ensure that .env file is correctly set up, comment out the production API URL to avoid conflicts.
```sh
#VITE_API_URL=https://dapi.snaptoapp.com  # Production API URL
VITE_API_URL=http://localhost:9000       # Local Development API URL
VITE_ENVIRONMENT=development             # Environment type (development/staging/production)
```
2. Modify both useEffect hooks for local development. You need to modify both AppLink and PreviewLink components to ensure they use localhost:3001 in development mode.                   
Modify src/pages/CustomizeApp/Publish/AppLink/index.tsx
```sh
useEffect(() => {
		if (ENVIRONMENT === 'development') {
			setPWAUrl('localhost:3001');
		} else if (ENVIRONMENT === 'test') {
			setPWAUrl('tapp.snaptoapp.com');
		} else {
			setPWAUrl('app.snaptoapp.com');
		}
	}, []);
```

Modify src/pages/CustomizeApp/Publish/PreviewLink/index.tsx
```sh
useEffect(() => {
		if (ENVIRONMENT === 'development') {
			setPWAUrl('localhost:3001');
		} else if (ENVIRONMENT === 'test') {
			setPWAUrl('tapp.snaptoapp.com');
		} else {
			setPWAUrl('app.snaptoapp.com');
		}
	}, []);
```

### **Running the Application**
```sh
npm run dev
```

---

## **Project Structure**
The project follows a structured and modular approach to organizing files and directories.

```sh
snaptoapp-frontend-admin/
│── node_modules/              # Dependencies installed via npm/yarn
│── public/                    # Public assets (favicons, index.html, etc.)
│── src/                       # Main source code
│   ├── assets/                # Static assets (images, icons, etc.)
│   ├── components/            # Reusable UI components
│   ├── enums/                 # TypeScript enums used across the app
│   ├── hooks/                 # Custom React hooks
│   ├── interfaces/            # TypeScript interfaces for type definitions
│   ├── models/                # Data models for structured objects
│   ├── pages/                 # Individual pages/screens of the application
│   ├── router/                # Application routing configurations
│   ├── services/              # API service calls and integrations
│   ├── store/                 # State management (Jotai)
│   ├── utility/               # Utility/helper functions
│   ├── App.tsx                # Main application component
│   ├── index.css              # Global styles
│   ├── main.tsx               # React main entry file
│   ├── vite-env.d.ts          # TypeScript environment type definitions
│
│── .dockerignore              # Docker ignore rules
│── .env                       # Environment variables (default)
│── .env.production            # Production environment variables
│── .env.staging               # Staging environment variables
│── .eslintrc.yml              # ESLint configuration file
│── .gitignore                 # Git ignore rules
│── Dockerfile                 # Docker configuration for containerization
│── index.html                 # Main HTML file for the app
│── nginx.conf                 # Nginx configuration file (if used for deployment)
│── package-lock.json          # Lock file for package dependencies
│── package.json               # Project dependencies and scripts
│── postcss.config.js          # PostCSS configuration for CSS processing
│── README.md                  # Documentation file (this file)
│── tailwind.config.cjs        # Tailwind CSS configuration
│── tsconfig.json              # TypeScript configuration
│── tsconfig.node.json         # TypeScript config for Node.js
│── vite.config.ts             # Vite configuration file
```
---
