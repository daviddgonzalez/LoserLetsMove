#ifndef PKE_JOINT_ANGLES_H
#define PKE_JOINT_ANGLES_H

#include <pybind11/numpy.h>

namespace py = pybind11;

// Takes an array of raw 3D landmarks and computes angles for key joints
py::array_t<float> compute_angles_from_coords(py::array_t<float> coords);

#endif // PKE_JOINT_ANGLES_H
