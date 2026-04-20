# 🌌 RepoPulse Dashboard

**RepoPulse** is a professional-grade, high-performance dashboard designed for developers and DevOps teams to monitor software releases and manage files across multiple platforms in real-time. Built with a focus on UI polish and functional depth, it combines unified repository tracking with a powerful multi-protocol file explorer.

![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)
![Version](https://img.shields.io/badge/version-1.7.0-emerald.svg)
![Tech](https://img.shields.io/badge/tech-React--18%20|%20Node.js%20|%20TypeScript-blueviolet.svg)

---

## 🚀 Key Features

### 📦 Software Release Tracking
*   **Multi-Source Support**: Track releases from GitHub, GitLab (Cloud & Self-hosted), Codeberg, and F-Droid.
*   **Deep Categorization**: Organize your workspace with up to **5 levels** of nested categories.
*   **Version History**: Maintain a complete history of the last 10 releases per repository.
*   **Smart Filtering**: Filter by OS compatibility (Windows, Linux, macOS), categories, or instant search.
*   **Layout Engine**: Seamlessly switch between **List**, **Grid**, **Bento**, and **Columns** views.

### 📂 Unified File Explorer
A dual-pane, enterprise-grade file manager supporting various protocols:
*   **Local Storage**: Full access to your server's drives with address bar navigation.
*   **FTP / SFTP**: Securely manage remote server files with built-in credential encryption.
*   **SMB (Samba)**: Access network shares directly from your browser.
*   **WebDAV**: Connect to cloud storage like Nextcloud or specialized WebDAV servers.
*   **HTTP Preview**: Recursively browse and preview files hosted on standard web servers.
*   **Advanced Operations**: Copy, Move, Rename, Delete, CHMOD, and Hash Verification (SHA256).

### 🎨 Design & Customization
*   **Fluent Design System**: Aesthetics inspired by Microsoft's modern design language.
*   **Glassmorphism**: Elegant blur effects and sophisticated opacities.
*   **Theme Designer**: Choose from professional themes (*Midnight, Forest, Sunset, Ocean*) or create your own with custom accent colors and blur intensities.
*   **Custom Branding**: Upload your own Favicons and Sidebar icons directly through the UI.

### ⚙️ Automation & Data
*   **Auto-Backup Engine**: Automatically download and archive new releases to your server.
*   **Webhooks**: Integrate with **Discord** or **Slack** for real-time update notifications.
*   **Transfer Logs**: Track every file movement with a persistent log and status reporting.
*   **Internationalization**: Full support for 15+ regions (EN-US, FR-FR, ES-ES, RU-RU, ZH-CN, etc.).

---

## 🛠 Tech Stack

*   **Frontend**: React 18, Vite, TypeScript, Framer Motion (Animations), Recharts (Stats).
*   **Backend**: Node.js (Express), `tsx` for execution.
*   **Styling**: Tailwind CSS 4.x.
*   **Storage**: Local persistence (No external database required).
*   **Icons**: Lucide React.

---

## 📥 Installation

### Prerequisites
*   **Node.js**: Version 18.x or higher.
*   **npm**: Version 9.x or higher.
*   **OS**: Windows, Linux, or macOS.

### Setup Instructions
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/RepoPulse.git
    cd RepoPulse
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Run in Development mode**:
    ```bash
    npm run dev
    ```
4.  **Build for Production**:
    ```bash
    npm run build
    ```
5.  **Start Production Server**:
    ```bash
    node server.js # (Ensure build assets are in dist folder)
    ```

---

## 📂 Project Structure

*   `/src`: Frontend source code (React components, hooks, assets).
*   `/server.ts`: Full-stack Express server handling APIs and file operations.
*   `/server/plugins`: Core logic for Explorer protocols (FTP, SMB, etc.).
*   `/user`: Persistent user data (settings, repos, encrypted connections).
*   `/Backup_RepoPulse`: Default directory for automated release backups.

---

## 🛡 Security & Privacy

*   **Local-First**: Your data never leaves your infrastructure. 
*   **Encryption**: Remote connection credentials are encrypted at rest on the server.
*   **Tokens**: GitHub Personal Access Tokens are used securely for higher rate limits and private repo access.

---

## 🤝 Credits

Engineered by **nexgen** with the assistance of advanced AI agents. 🚀
Special thanks to the open-source community for the incredible libraries powering this project.

---

## 📄 License

This project is licensed under the **Apache License 2.0**.
