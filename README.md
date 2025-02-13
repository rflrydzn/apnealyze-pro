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

## **Installation**

### **Clone the Repository**
```sh
git clone https://github.com/your-org/snaptoapp-frontend-admin.git
cd snaptoapp-frontend-admin
```

### **Install Dependencies**
```sh
npm i
```

---

## **Setup**

### **Environmental Variables**
Before running the project, ensure you have the necessary environment variables set up. These variables are required for API communication, authentication, and third-party services.
```sh
VITE_API_URL=https://dapi.snaptoapp.com  # Production API URL
VITE_API_URL=http://localhost:9000       # Local Development API URL
VITE_ENVIRONMENT=development             # Environment type (development/staging/production)
```

---
