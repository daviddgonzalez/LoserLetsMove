#include <pybind11/pybind11.h>
#include "dtw.h"
#include "joint_angles.h"

namespace py = pybind11;

PYBIND11_MODULE(pke_cpp, m) {
    m.doc() = "PKE High-Performance C++ Backend for Kinematic Evaluation";

    m.def("compute_dtw", &compute_dtw, 
          "Compute Dynamic Time Warping with a Sakoe-Chiba band constraint",
          py::arg("seq_a"), py::arg("seq_b"), py::arg("band_width") = 10);

    m.def("compute_angles_from_coords", &compute_angles_from_coords,
          "Convert raw 3D pose coordinates to a set of specific joint angles",
          py::arg("coords"));
}
