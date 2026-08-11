/**
 * Loader for the @wordpress/vips/worker module.
 *
 * This tiny module exists so that WordPress can discover @wordpress/vips/worker
 * as a dynamic module dependency and include it in the import map. Without this,
 * the dynamic import() call in @wordpress/upload-media's IIFE bundle cannot
 * resolve the module URL at runtime.
 *
 * The loader is enqueued on block editor pages via wp_enqueue_script_module()
 * in lib/client-assets.php. The heavy vips/worker module (~3.8MB of inlined WASM)
 * is only fetched when image processing is actually triggered.
 *
 * @see packages/upload-media/src/store/utils/vips.ts — the consumer
 * @see packages/latex-to-mathml/src/loader.ts — the reference pattern
 */
export default function loader() {
	return import( '@wordpress/vips/worker' );
}
