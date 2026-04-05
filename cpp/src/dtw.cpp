#include "dtw.h"
#include <cmath>
#include <algorithm>
#include <limits>
#include <stdexcept>

// Calculate cosine distance: 1.0 - CosineSimilarity
// CosineSimilarity = (A . B) / (||A|| * ||B||)
float cosine_distance(const float* frame_a, const float* frame_b, int num_angles) {
    float dot_product = 0.0f;
    float norm_a = 0.0f;
    float norm_b = 0.0f;

    for (int i = 0; i < num_angles; ++i) {
        float a = frame_a[i];
        float b = frame_b[i];
        dot_product += a * b;
        norm_a += a * a;
        norm_b += b * b;
    }

    if (norm_a == 0.0f || norm_b == 0.0f) {
        return 1.0f; // Maximum distance if vector is zero
    }

    float sim = dot_product / (std::sqrt(norm_a) * std::sqrt(norm_b));
    // Clamp to valid range due to float precision issues
    sim = std::max(-1.0f, std::min(1.0f, sim)); 
    
    return 1.0f - sim; // Distance is [0, 2]
}

py::tuple compute_dtw(py::array_t<float> seq_a, py::array_t<float> seq_b, int band_width) {
    auto buf_a = seq_a.request();
    auto buf_b = seq_b.request();

    if (buf_a.ndim != 2 || buf_b.ndim != 2) {
        throw std::runtime_error("Inputs must be 2D arrays (Frames x Angles)");
    }
    if (buf_a.shape[1] != buf_b.shape[1]) {
        throw std::runtime_error("Inputs must have the same number of angles");
    }

    int N = buf_a.shape[0];
    int M = buf_b.shape[0];
    int num_angles = buf_a.shape[1];

    auto* ptr_a = static_cast<float*>(buf_a.ptr);
    auto* ptr_b = static_cast<float*>(buf_b.ptr);

    // Accumulated cost matrix
    std::vector<std::vector<float>> cost(N, std::vector<float>(M, std::numeric_limits<float>::infinity()));

    // Keep track of moves for the warping path
    // 0 = diag, 1 = up, 2 = left
    std::vector<std::vector<int>> trace(N, std::vector<int>(M, -1));

    cost[0][0] = cosine_distance(ptr_a, ptr_b, num_angles);
    trace[0][0] = 0;

    for (int i = 0; i < N; ++i) {
        int j_start = std::max(0, i - band_width);
        int j_end = std::min(M, i + band_width + 1);

        for (int j = j_start; j < j_end; ++j) {
            if (i == 0 && j == 0) continue;

            float local_dist = cosine_distance(ptr_a + (i * num_angles), ptr_b + (j * num_angles), num_angles);

            float cost_diag = (i > 0 && j > 0) ? cost[i-1][j-1] : std::numeric_limits<float>::infinity();
            float cost_up   = (i > 0) ? cost[i-1][j] : std::numeric_limits<float>::infinity();
            float cost_left = (j > 0) ? cost[i][j-1] : std::numeric_limits<float>::infinity();

            float min_cost = cost_diag;
            int step = 0; // diag

            if (cost_up < min_cost) {
                min_cost = cost_up;
                step = 1; // up
            }
            if (cost_left < min_cost) {
                min_cost = cost_left;
                step = 2; // left
            }

            cost[i][j] = local_dist + min_cost;
            trace[i][j] = step;
        }
    }

    float final_cost = cost[N-1][M-1];

    // Backtrack to find the optimal warping path
    std::vector<std::pair<int, int>> path;
    int curr_i = N - 1;
    int curr_j = M - 1;

    while (curr_i >= 0 && curr_j >= 0) {
        path.push_back({curr_i, curr_j});
        if (curr_i == 0 && curr_j == 0) break;
        
        int step = trace[curr_i][curr_j];
        if (step == 0)      { curr_i--; curr_j--; }
        else if (step == 1) { curr_i--; }
        else if (step == 2) { curr_j--; }
        else break; // Should not happen
    }

    std::reverse(path.begin(), path.end());

    // Convert path to pybind11 list
    py::list py_path;
    for (const auto& p : path) {
        py_path.append(py::make_tuple(p.first, p.second));
    }

    return py::make_tuple(py_path, final_cost);
}
