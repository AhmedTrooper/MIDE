# MIDE - Professional Code Editor

MIDE is a high-performance, production-grade Integrated Development Environment (IDE) built with **Tauri v2**, **Rust**, and **React**. Designed as a lightweight yet powerful alternative to VS Code, MIDE focuses on speed, efficiency, and a premium developer experience.

## 🚀 Features

- **Blazing Fast**: Powered by Rust backend and Tauri's lightweight webview.
- **Monaco Editor**: The same battle-tested editor engine used in VS Code.
- **File System Integration**: Native file tree exploration, reading, and writing.
- **Modern UI**: Sleek, dark-themed interface built with Tailwind CSS v4.
- **Production Ready**: Robust error handling, state management with Zustand, and type safety with TypeScript.

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Framer Motion
- **Backend**: Rust (Tauri v2)
- **State Management**: Zustand
- **Editor**: Monaco Editor
- **Icons**: Lucide React

## 📦 Installation

### Prerequisites

- Rust & Cargo
- Node.js & Yarn/NPM

### Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run in development mode:
   ```bash
   npm run tauri dev
   ```

### CLI Installation

Install the `mide` command-line tool to open directories from your terminal (like `code .`):

```bash
cd cli
./install.sh
```

Then use it anywhere:

```bash
mide .              # Open current directory
mide /path/to/dir   # Open specific directory
```

See [cli/README.md](cli/README.md) for more details.

## 🏗 Architecture

MIDE uses a hybrid architecture:

- **Rust Core**: Handles heavy lifting like file system operations, terminal processes (planned), and native OS integrations.
- **React Frontend**: Provides a responsive, accessible, and rich user interface.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT
