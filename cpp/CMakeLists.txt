cmake_minimum_required(VERSION 3.15)
project(PKE_CPP VERSION 0.1.0)

# We require C++17
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# Find pybind11 and Python
find_package(pybind11 REQUIRED)
find_package(Python3 COMPONENTS Development.Module REQUIRED)

# Include directories
include_directories(include)

# Create the Python extension module
pybind11_add_module(pke_cpp
    src/bindings.cpp
    src/dtw.cpp
    src/joint_angles.cpp
)

# Optimization flags for blazing fast execution
if(CMAKE_CXX_COMPILER_ID MATCHES "MSVC")
    target_compile_options(pke_cpp PRIVATE /O2 /fp:fast)
else()
    target_compile_options(pke_cpp PRIVATE -O3 -ffast-math)
endif()
