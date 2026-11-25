/*
 * A separate script module, with no imports of the editor's scripts, so that a
 * page can load the editor assets (`wp-editor` among them) before it imports
 * `@wordpress/lazy-editor`, which reads their globals as soon as it loads.
 */
export { useEditorAssets, loadEditorAssets } from './hooks/use-editor-assets';
