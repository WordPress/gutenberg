# Detection model

`face_detection_yunet_2023mar.onnx` is YuNet, a face detector small enough to
run on an image while it is being uploaded.

| | |
| --- | --- |
| Upstream | [opencv/opencv_zoo](https://github.com/opencv/opencv_zoo/tree/main/models/face_detection_yunet) |
| Original author | Shiqi Yu and Yuantao Feng, [ShiqiYu/libfacedetection](https://github.com/ShiqiYu/libfacedetection) |
| Licence | MIT, see [LICENSE.md](LICENSE.md) |
| Size | 232 KB |
| SHA-256 | `8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4` |

The licence is worth being precise about. The `opencv_zoo` repository as a whole
is Apache-2.0, which is not GPLv2 compatible and so cannot ship in WordPress.
Individual models in it carry their own licences, and this one is MIT, held by
its original author rather than by OpenCV. The MIT text is copied into
[LICENSE.md](LICENSE.md) next to the file it applies to so the distinction does
not have to be rediscovered.

## Updating it

The file is stored with Git LFS upstream, so a plain `raw.githubusercontent.com`
URL returns a pointer rather than the model:

```sh
curl -L -o packages/subject-detection/assets/face_detection_yunet_2023mar.onnx \
  https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx
```

Check the hash above afterwards, and re-check the licence: it is per model and
per release, not a property of the repository.

## What the graph expects

A fixed 640x640 input named `input`, planar BGR, values 0-255, unnormalised. It
returns twelve tensors - classification, objectness, box and keypoint outputs at
strides 8, 16 and 32. `../src/yunet.ts` covers both ends of that.
