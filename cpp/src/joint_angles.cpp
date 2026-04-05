#include "joint_angles.h"
#include <vector>
#include <cmath>
#include <stdexcept>
#include <algorithm>

py::array_t<float> compute_angles_from_coords(py::array_t<float> coords) {
    auto buf = coords.request();

    if (buf.ndim != 3) {
        throw std::runtime_error("Coordinates must be a 3D array (Frames x Joints x 3)");
    }
    
    int T = buf.shape[0];
    int J = buf.shape[1];
    int C = buf.shape[2];

    if (J != 33 || C < 3) {
        throw std::runtime_error("Expected 33 joints with at least 3 coordinates (x, y, z)");
    }

    auto* ptr = static_cast<float*>(buf.ptr);

    // Define the joint triplets (parent, pivot, child)
    // 0: Right elbow
    // 1: Right shoulder
    // 2: Left elbow
    // 3: Left shoulder
    // 4: Right knee
    // 5: Right hip angle (trunk)
    // 6: Left knee
    // 7: Left hip angle (trunk)
    // 8: Hip alignment
    // 9: Shoulder alignment
    const std::vector<std::tuple<int, int, int>> triplets = {
        {12, 14, 16},
        {11, 12, 14}, 
        {11, 13, 15}, 
        {12, 11, 13}, 
        {24, 26, 28}, 
        {0, 24, 26},  
        {23, 25, 27}, 
        {0, 23, 25},  
        {23, 24, 12}, 
        {11, 12, 24}  
    };

    int num_angles = triplets.size();

    // Create the output numpy array (T, num_angles)
    auto result = py::array_t<float>({T, num_angles});
    auto buf_out = result.request();
    auto* ptr_out = static_cast<float*>(buf_out.ptr);

    for (int t = 0; t < T; ++t) {
        int frame_offset = t * J * C;

        for (int a = 0; a < num_angles; ++a) {
            int p = std::get<0>(triplets[a]);
            int j = std::get<1>(triplets[a]);
            int c = std::get<2>(triplets[a]);

            float vec_a_x = ptr[frame_offset + p * C + 0] - ptr[frame_offset + j * C + 0];
            float vec_a_y = ptr[frame_offset + p * C + 1] - ptr[frame_offset + j * C + 1];
            float vec_a_z = ptr[frame_offset + p * C + 2] - ptr[frame_offset + j * C + 2];

            float vec_b_x = ptr[frame_offset + c * C + 0] - ptr[frame_offset + j * C + 0];
            float vec_b_y = ptr[frame_offset + c * C + 1] - ptr[frame_offset + j * C + 1];
            float vec_b_z = ptr[frame_offset + c * C + 2] - ptr[frame_offset + j * C + 2];

            float dot = vec_a_x * vec_b_x + vec_a_y * vec_b_y + vec_a_z * vec_b_z;
            float mag_a = std::sqrt(vec_a_x * vec_a_x + vec_a_y * vec_a_y + vec_a_z * vec_a_z);
            float mag_b = std::sqrt(vec_b_x * vec_b_x + vec_b_y * vec_b_y + vec_b_z * vec_b_z);

            float denominator = mag_a * mag_b;
            if (denominator < 1e-8f) {
                ptr_out[t * num_angles + a] = 0.0f; // Default if vectors are zero
            } else {
                float cos_angle = dot / denominator;
                cos_angle = std::max(-1.0f, std::min(1.0f, cos_angle)); // Clamp floating errors
                ptr_out[t * num_angles + a] = std::acos(cos_angle);
            }
        }
    }

    return result;
}
