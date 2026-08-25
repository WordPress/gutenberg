/**
 * Loader for the @wordpress/subject-detection/detector module.
 *
 * This tiny module exists so that WordPress can discover the detector as a
 * dynamic module dependency and include it in the import map. Without it, the
 * dynamic import() call in @wordpress/upload-media's IIFE bundle cannot
 * resolve the module URL at runtime.
 *
 * The loader is enqueued on block editor pages via wp_enqueue_script_module()
 * in lib/client-assets.php. The detector pulls in an inference runtime, so it
 * is only fetched once an image is actually being cropped.
 *
 * @see packages/upload-media/src/store/utils/subject-detection.ts - the consumer
 * @see packages/vips/src/loader.ts - the reference pattern
 */
export default function loader() {
	return import( '@wordpress/subject-detection/detector' );
}
