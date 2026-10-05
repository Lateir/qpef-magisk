#include "gaze_damper_native.h"

#include <math.h>

static double clamp(double value, double low, double high) {
    return fmin(fmax(value, low), high);
}

void qpro_damp_gaze(QproGazeDamper *state,
                    const double left[2], const double right[2],
                    double time_s, double out_left[2], double out_right[2]) {
    const double acceleration = 900.0;
    const double initial_resistance = 0.8;
    const double max_speed = 90.0;
    const double follow_time = 0.045;
    double target[2], midpoint[2];

    for (int axis = 0; axis < 2; ++axis) {
        target[axis] = right[axis] - left[axis];
        midpoint[axis] = (left[axis] + right[axis]) * 0.5;
        if (!isfinite(target[axis]) || !isfinite(midpoint[axis]) || !isfinite(time_s)) {
            out_left[0] = left[0]; out_left[1] = left[1];
            out_right[0] = right[0]; out_right[1] = right[1];
            state->initialized = 0;
            return;
        }
    }

    double elapsed = state->initialized ? time_s - state->last_time_s : 0.0;
    if (!state->initialized || elapsed > 0.25) {
        for (int axis = 0; axis < 2; ++axis) {
            state->difference[axis] = target[axis];
            state->velocity[axis] = 0.0;
            state->outward_age[axis] = 0.0;
        }
        state->initialized = 1;
    } else if (elapsed > 0.0) {
        double dt = fmin(elapsed, 0.05);
        for (int axis = 0; axis < 2; ++axis) {
            double *difference = &state->difference[axis];
            double *velocity = &state->velocity[axis];
            double *age = &state->outward_age[axis];

            if (target[axis] * *difference >= 0.0 &&
                fabs(target[axis]) <= fabs(*difference)) {
                *difference = target[axis];
                *velocity = 0.0;
                *age = 0.0;
            }
            if (target[axis] * *difference < 0.0) {
                *difference = 0.0;
                *velocity = 0.0;
                *age = 0.0;
            }

            double error = target[axis] - *difference;
            double desired_velocity = clamp(error / follow_time,
                                            -max_speed, max_speed);
            double ramp = clamp(*age / 0.08, 0.0, 1.0);
            double max_change = acceleration *
                (1.0 - initial_resistance * (1.0 - ramp)) * dt;
            *velocity += clamp(desired_velocity - *velocity,
                               -max_change, max_change);
            double step = *velocity * dt;
            int arrived = step * error >= 0.0 && fabs(step) >= fabs(error);
            *difference += arrived ? error : step;
            if (arrived) *velocity = 0.0;
            *age = arrived ? 0.0 : *age + dt;
        }
    }

    state->last_time_s = time_s;
    for (int axis = 0; axis < 2; ++axis) {
        out_left[axis] = midpoint[axis] - state->difference[axis] * 0.5;
        out_right[axis] = midpoint[axis] + state->difference[axis] * 0.5;
    }
}
