cmake_minimum_required(VERSION 3.15)
project(PKE_CPP VERSION 0.1.0)

# We require C++17
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# Find Python first
find_package(Python3 COMPONENTS Interpreter Development.Module REQUIRED)

# Ask Python exactly where pybind11 is installed inside the virtual environment
execute_process(
    COMMAND "${Python3_EXECUTABLE}" -m pybind11 --cmakedir
    OUTPUT_VARIABLE pybind11_DIR
    OUTPUT_STRIP_TRAILING_WHITESPACE
)

# Find pybind11 using that exact path
find_package(pybind11 REQUIRED PATHS "${pybind11_DIR}" NO_DEFAULT_PATH)

# Include directories
include_directories(include)

# Create the Python extension module
pybind11_add_module(pke_cpp
    src/bindings.cpp
    src/dtw.cpp
    src/joint_angles.cpp
)

# Optimization flags — only apply in Release mode to avoid /RTC1 conflict
target_compile_options(pke_cpp PRIVATE
    $<$<AND:$<CXX_COMPILER_ID:MSVC>,$<CONFIG:Release>>:/O2 /fp:fast>
    $<$<AND:$<NOT:$<CXX_COMPILER_ID:MSVC>>,$<CONFIG:Release>>:-O3 -ffast-math>
)
