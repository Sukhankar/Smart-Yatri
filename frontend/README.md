# Smart Yatri

Smart Yatri is a web-based system designed for streamlined bus travel management for students, faculty, and operators. Easily book tickets, manage passes, review travel history, and validate bus rides—all in a modern, user-friendly interface.

## Features

- **For Students & Faculty**
  - Dashboard overview of your tickets and pass status.
  - Book one-time tickets or purchase monthly passes.
  - View and download all purchased tickets.
  - Display travel passes as QR codes for easy scanning.
  - View detailed travel history records.

- **For Operators & Admins**
  - Validate tickets and passes with in-app QR code scanner.
  - Manage users, view bus routes, and monitor travel analytics.
  - View comprehensive travel and validation history.

## Tech Stack

- **Frontend:** React (Vite + Tailwind CSS UI)
- **Backend:** Node.js / Express (assumed)
- **Authentication:** JWT or session-based (implementation dependent)
- **QR Code Generation:** [qrcode.react](https://github.com/zpao/qrcode.react)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [npm](https://npmjs.com/)

### Installation

1. **Clone the repository**
    ```bash
    git clone https://github.com/your-username/smart-yatri.git
    cd smart-yatri
    ```

2. **Install dependencies**
    ```bash
    cd frontend
    npm install
    ```

3. **Start the frontend**
    ```bash
    npm run dev
    ```

4. **(Optional) Start the backend**  
   Refer to the `/backend` directory and README if backend code is included.

### Project Structure (Frontend)

```
frontend/
├── src/
│   ├── components/        # Reusable UI components (Sidebar, QRDisplay, etc.)
│   ├── pages/             # Main application pages (Dashboard, BookTicket, TravelHistory, etc.)
│   ├── services/          # API abstraction and service logic
│   ├── App.jsx
│   └── main.jsx
├── public/
└── package.json
```

## Usage

- **Sign up** as a student or faculty user.
- **Book tickets** or **purchase a pass**, view all from your dashboard.
- **Show your QR code** to bus operators for boarding.
- **Operators** scan and validate tickets or passes using their dashboard.

## Screenshots

> Screenshots and UI GIFs coming soon!

## Contributing

1. Fork this repository
2. Create a new branch:
    ```bash
    git checkout -b my-feature
    ```
3. Commit your changes and push:
    ```bash
    git commit -am 'Add new feature'
    git push origin my-feature
    ```
4. Open a pull request

## License

[MIT License](LICENSE)

---

_“Smart Yatri – Making public transportation effortless and smart!”_
