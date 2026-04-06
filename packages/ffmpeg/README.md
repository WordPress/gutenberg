# FFmpeg

FFmpeg WASM wrapper for client-side video processing in WordPress.

Used by `@wordpress/upload-media` to convert animated GIFs to MP4/WebM videos
during upload, dramatically reducing file sizes while preserving the GIF-like
playback experience.

## Usage

This package is not meant to be used directly. It is loaded lazily by
`@wordpress/upload-media` when an animated GIF is detected in the upload queue.

The heavy FFmpeg WASM binary (~31MB) is provided by the `wp-ffmpeg-wasm`
canonical plugin, which is installed on-demand when needed. The conversion
runs entirely in a Web Worker, keeping the main thread free.

## Installation

Install the module:

```bash
npm install @wordpress/ffmpeg
```

## Requirements

-   `crossOriginIsolated` context (for SharedArrayBuffer support)
-   Web Workers support
-   WebAssembly support
