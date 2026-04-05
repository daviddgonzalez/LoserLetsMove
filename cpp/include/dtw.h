#ifndef PKE_DTW_H
#define PKE_DTW_H

#include <vector>
#include <tuple>
#include <pybind11/numpy.h>

namespace py = pybind11;

// Computes the angular cosine distance between two frames of joint angles
float cosine_distance(const float* frame_a, const float* frame_b, int num_angles);

// Computes Dynamic Time Warping between two sequences with a Sakoe-Chiba band constraint
py::tuple compute_dtw(py::array_t<float> seq_a, py::array_t<float> seq_b, int band_width);

#endif // PKE_DTW_H
