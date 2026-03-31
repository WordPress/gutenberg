/**
 * Loader for the @wordpress/ffmpeg/worker module.
 *
 * This tiny module exists so that WordPress can discover @wordpress/ffmpeg/worker
 * as a dynamic module dependency and include it in the import map. Without this,
 * the dynamic import() call in @wordpress/upload-media's IIFE bundle cannot
 * resolve the module URL at runtime.
 *
 * The loader is enqueued on block editor pages via wp_enqueue_script_module()
 * in lib/client-assets.php. The heavy ffmpeg/worker module (inlined WASM)
 * is only fetched when GIF-to-video conversion is actually triggered.
 *
 * @see packages/upload-media/src/store/utils/ffmpeg.ts — the consumer
 * @see packages/vips/src/loader.ts — the reference pattern
 */
export default function loader() {
	return import( '@wordpress/ffmpeg/worker' );
}
