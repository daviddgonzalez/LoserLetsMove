import socket
import subprocess
import os
import sys
import time
import signal

def is_port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

def find_free_port(start_port: int) -> int:
    port = start_port
    while is_port_in_use(port):
        port += 1
    return port

def main():
    print(" Looking for available ports...")
    backend_port = find_free_port(8000)
    frontend_port = find_free_port(3000)
    
    print(f" Backend Port: {backend_port}")
    print(f" Frontend Port: {frontend_port}")
    
    backend_env = os.environ.copy()
    backend_env["API_PORT"] = str(backend_port)
    
    frontend_env = os.environ.copy()
    frontend_env["PORT"] = str(frontend_port)
    frontend_env["NEXT_PUBLIC_API_URL"] = f"http://localhost:{backend_port}"
    frontend_env["NEXT_PUBLIC_WS_URL"] = f"ws://localhost:{backend_port}"
    
    # Identify Python executable
    venv_dir = os.path.join("backend", ".venv")
    if os.name == 'nt':
        python_exe = os.path.join(venv_dir, "Scripts", "python.exe")
    else:
        python_exe = os.path.join(venv_dir, "bin", "python")
        
    if not os.path.exists(python_exe):
        print(f"  Virtual environment not found at {venv_dir}. Using system python.")
        python_exe = sys.executable  # Fallback to system python
        
    print(f"\n Starting Backend on http://localhost:{backend_port} ...")
    backend_process = subprocess.Popen(
        [python_exe, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", str(backend_port)],
        cwd="backend",
        env=backend_env
    )
    
    print(f" Starting Frontend on http://localhost:{frontend_port} ...")
    frontend_process = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd="frontend",
        env=frontend_env,
        shell=(os.name == 'nt')
    )
    
    print("\n" + "="*50)
    print(" Both servers are running! ")
    print(f" Frontend App: http://localhost:{frontend_port}")
    print(f"  Backend API:  http://localhost:{backend_port}")
    print(f" API Docs:     http://localhost:{backend_port}/docs")
    print("="*50 + "\n")
    print("Press Ctrl+C to shut down both servers safely.")
    
    def cleanup(signum, frame):
        print("\n Shutting down servers...")
        backend_process.terminate()
        frontend_process.terminate()
        backend_process.wait()
        frontend_process.wait()
        print("Done.")
        sys.exit(0)
        
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)
    
    while True:
        time.sleep(1)
        # Check if either process died unexpectedly
        if backend_process.poll() is not None:
            print(" Backend server exited unexpectedly!")
            frontend_process.terminate()
            break
        if frontend_process.poll() is not None:
            print(" Frontend server exited unexpectedly!")
            backend_process.terminate()
            break

if __name__ == "__main__":
    main()
