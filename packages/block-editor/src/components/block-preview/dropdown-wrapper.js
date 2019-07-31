/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * BlockPreviewDropdownWrapper provides styling so you can show Preview inside
 * Dropdown components. It expects BlockPreview as a single child.
 *
 * @param {Object} props Component props.
 *
 * @return {WPElement} Rendered element.
 */
export default function BlockPreviewDropdownWrapper( { children } ) {
	return (
		<div className="block-editor-block-preview__dropdown-wrapper">
			<div className="block-editor-block-preview__dropdown-wrapper-title">{ __( 'Preview' ) }</div>
			{ children }
		</div>
	);
}
