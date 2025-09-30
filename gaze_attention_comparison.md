# Gaze Attention Implementation Comparison

## Python vs JavaScript Implementation

### Constants and Landmarks
| Feature | Python | JavaScript | Match |
|---------|--------|------------|-------|
| LEFT_EYE_INDICES | [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246] | [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246] | ✅ |
| RIGHT_EYE_INDICES | [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398] | [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398] | ✅ |
| LEFT_EYE_INNER | 133 | 133 | ✅ |
| LEFT_EYE_OUTER | 33 | 33 | ✅ |
| LEFT_EYE_CENTER | 468 | 468 | ✅ |
| RIGHT_EYE_INNER | 362 | 362 | ✅ |
| RIGHT_EYE_OUTER | 263 | 263 | ✅ |
| RIGHT_EYE_CENTER | 473 | 473 | ✅ |

### Thresholds
| Feature | Python | JavaScript | Match |
|---------|--------|------------|-------|
| EAR threshold | 0.20 | 0.20 | ✅ |
| Gaze left threshold | < 0.4 | < 0.4 | ✅ |
| Gaze right threshold | > 0.6 | > 0.6 | ✅ |
| Confidence threshold | >= 0.90 | >= 0.90 | ✅ |

### EAR Calculation
| Feature | Python | JavaScript | Match |
|---------|--------|------------|-------|
| Top landmarks | [1, 2] | [1, 2] | ✅ |
| Bottom landmarks | [4, 5] | [4, 5] | ✅ |
| Horizontal landmarks | [0, 3] | [0, 3] | ✅ |
| Default value | 0.3 | 0.3 | ✅ |
| Formula | avg_vertical / horizontal_dist | avgVertical / horizontalDist | ✅ |

### Gaze Ratio Calculation
| Feature | Python | JavaScript | Match |
|---------|--------|------------|-------|
| Formula | center_horizontal_pos / eye_width | centerHorizontalPos / eyeWidth | ✅ |
| Clipping | np.clip(ratio, 0.0, 1.0) | Math.max(0, Math.min(1, ratio)) | ✅ |

### Confidence Calculation
| Feature | Python | JavaScript | Match |
|---------|--------|------------|-------|
| Formula | max(0, 1 - center_distance * 2) | Math.max(0, 1 - centerDistance * 2) | ✅ |
| Center distance | abs(avg_gaze_ratio - 0.5) | Math.abs(avgGazeRatio - 0.5) | ✅ |

## Conclusion
✅ **All algorithms, constants, and thresholds match exactly between Python and JavaScript implementations.**

The JavaScript implementation is a faithful translation of the Python gaze_attention code with identical:
- Landmark indices
- EAR calculation method
- Gaze ratio calculation
- Confidence thresholds
- Attention detection logic
