# MIDE

**MIDE** is a high-performance, premium code editor built with **Tauri v2** and **React**. It aims to provide a VS Code-like experience with a focus on speed, aesthetics, and mobile responsiveness.

## 🚀 Features

- **Custom UI**: Fully custom title bar and window controls for a seamless, frameless experience.
- **File System Integration**:
  - Open folders and projects.
  - Read and write files directly using Rust-powered backend.
  - Create files and directories.
- **Code Editing**:
  - Powered by **Monaco Editor** (the core of VS Code).
  - Syntax highlighting and minimap.
- **Responsive Design**:
  - Mobile-friendly UI with adaptive menus.
  - Custom hamburger menu for smaller screens.
- **State Management**: Robust state handling with **Zustand**.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Rust (Tauri v2)
- **Editor**: Monaco Editor
- **State**: Zustand

## 📦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/) (latest stable)
- [Yarn](https://yarnpkg.com/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/mide.git
    cd mide
    ```

2.  **Install dependencies:**
    ```bash
    yarn install
    ```

3.  **Run in Development Mode:**
    ```bash
    yarn tauri dev
    ```

4.  **Build for Production:**
    ```bash
    yarn tauri build
    ```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[MIT](LICENSE)
