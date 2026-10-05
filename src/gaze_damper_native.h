#ifndef QPRO_GAZE_DAMPER_NATIVE_H
#define QPRO_GAZE_DAMPER_NATIVE_H

typedef struct {
    double difference[2];
    double velocity[2];
    double outward_age[2];
    double last_time_s;
    int initialized;
} QproGazeDamper;

/* Input and output angles are yaw, pitch in degrees. The midpoint is unchanged. */
void qpro_damp_gaze(QproGazeDamper *state,
                    const double left[2], const double right[2],
                    double time_s, double out_left[2], double out_right[2]);

#endif
