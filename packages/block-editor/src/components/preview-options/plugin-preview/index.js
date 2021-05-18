/**
 * WordPress dependencies
 */
import { Fill } from '@wordpress/components';

/**
 * Component used by a plugin to define the contents of a "custom
 * preview". The children of this component will be displayed in the main editor
 * screen when this "custom preview" is chosen from the preview menu.
 *
 * @param {Object}    props           Component properties.
 * @param {string}    props.previewId The internal name of this custom preview. Must match the `previewId` given to `PluginPreviewMenuItem`.
 * @param {WPElement} props.children  Children to be rendered.
 */
export default function PluginPreview( { children, previewId, ...props } ) {
	return (
		<Fill
			name={ `core/block-editor/plugin-preview/${ previewId }` }
			{ ...props }
		>
			{ children }
		</Fill>
	);
}
