# Subject Detection

Finds the subject of an image so a crop can keep it in frame.

WordPress crops hard-cropped sizes from the centre of the frame. That is the
right default when nothing is known about the picture, and the wrong one for a
portrait with the subject in the upper third, where the `thumbnail` size cuts
the head off. This package supplies the missing information: an area to protect,
and a score saying how much to trust it.

Only faces are detected today. The API is named for the subject rather than for
the detector because the shape of the answer - a rectangle and a confidence -
is what a crop needs, whatever produced it.

## Installation

Install the module

```bash
npm install @wordpress/subject-detection --save
```

_This package assumes that your code will run in an **ES2015+** environment._

## Usage

```js
import { detectSubject } from '@wordpress/subject-detection/detector';

const subject = await detectSubject( file, {
	assetsUrl: 'https://example.com/wp-content/plugins/gutenberg/build/media-detection/',
} );

if ( subject ) {
	// { x, y, width, height, confidence, source: 'face', detections: [ … ] }
}
```

`x`, `y`, `width` and `height` are fractions of the image, so they survive the
resize between detecting and cropping. `null` means nothing was found with
enough confidence, which is the signal to leave the crop alone.

Import the detector from `@wordpress/subject-detection/detector` rather than
from the package root. Loading it pulls in an inference runtime, and the root
entry point deliberately does not, so types and the pure helpers can be imported
anywhere.

### Supplying the runtime

`assetsUrl` is required and has no default. Detection runs on
[ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/), which this
package loads from that URL instead of bundling. Four files have to be
reachable under it:

| File | Size | From |
| --- | --- | --- |
| `ort.wasm.min.mjs` | 50 KB | `onnxruntime-web` |
| `ort-wasm-simd-threaded.wasm` | 14 MB | `onnxruntime-web` |
| `ort-wasm-simd-threaded.mjs` | 24 KB | `onnxruntime-web` |
| `face_detection_yunet_2023mar.onnx` | 232 KB | [`assets/`](assets/) |

In a Gutenberg checkout, put them in place with:

```sh
node packages/subject-detection/bin/install-runtime.mjs
```

That writes into `build/media-detection/`, which is where
`lib/experimental/editor-settings.php` points the editor. It is a separate
command rather than part of `npm run build` for a reason - see below.

## Licensing

**The runtime is injected rather than bundled because WordPress cannot ship
it.** ONNX Runtime's own source is MIT, but the WebAssembly binary it publishes
has Apache-2.0 components compiled into it, flatbuffers and the ONNX reference
implementation among them; `strings` on `ort-wasm-simd-threaded.wasm` finds
both. Apache-2.0 is not GPLv2 compatible, and Gutenberg's own
[licence check](../../tools/validation/check-licenses.mjs) classifies it as
something the project may build with but
[may not include in a release](../scripts/utils/license.js).

So this package declares no production dependencies, the plugin ships no
runtime, and anyone testing the experiment installs one themselves. When it is
absent, detection fails and the crop falls back to the centre, which is what
WordPress does today.

Shipping this for real needs one of:

-   **A ruling that WordPress will take Apache-2.0.** WordPress is GPLv2 *or
    later*, and Apache-2.0 is GPLv3 compatible, so a combined work could be
    distributed under GPLv3. That is a question for the people who own
    WordPress licensing rather than one to settle in a pull request.
-   **A GPLv2-compatible runtime.** [ncnn](https://github.com/Tencent/ncnn) is
    BSD-3 and actively maintained; [tract](https://github.com/sonos/tract) is
    dual MIT/Apache-2.0, so it can be taken under MIT. Either runs this model.
    Neither publishes a browser build, so Gutenberg would own compiling one.
-   **A detector that needs no runtime.** [pico.js](https://github.com/nenadmarkus/picojs)
    is MIT, 5 KB of JavaScript plus a 240 KB cascade, and reports a score. It
    is also markedly weaker: on the same 16 portraits, it found 8 faces where
    YuNet found 15, and its score is an unbounded cascade sum rather than a
    calibrated probability.

The model itself is not part of this problem. YuNet is MIT; see
[assets/README.md](assets/README.md), which is careful about the difference
between the model's licence and the Apache-2.0 licence of the `opencv_zoo`
repository it is distributed from.

## API

### `detectSubject( source, options )`

Runs the detector over an image. See usage above.

### `toSubjectArea( detections, minConfidence )`

Combines detections into the single area to protect. Exported from the package
root, no runtime needed.

### Model helpers

`getLetterbox`, `imageDataToTensor`, `decodeDetections`,
`nonMaximumSuppression` and `toNormalizedDetections` are the pre- and
post-processing either side of the model, exported from the root so they can be
tested and reused without loading a runtime.

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project
is organized as a monorepo. It's made up of multiple self-contained software
packages, each with a specific purpose. The packages in this monorepo are
published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/)
as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole,
please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
