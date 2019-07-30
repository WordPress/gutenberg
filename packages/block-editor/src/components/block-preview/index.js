/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import { Disabled } from '@wordpress/components';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockEditorProvider from '../provider';
import BlockList from '../block-list';

/**
 * Block Preview Component: It renders a preview given a block name and attributes.
 *
 * @param {Object} props Component props.
 *
 * @return {WPElement} Rendered element.
 */
function BlockPreview( props ) {
	return (
		<div className="editor-block-preview block-editor-block-preview">
			<div className="editor-block-preview__title block-editor-block-preview__title">{ __( 'Preview' ) }</div>
			<BlockPreviewContent { ...props } />
		</div>
	);
}

export function BlockPreviewContent( { name, attributes, innerBlocks, settings } ) {
	const block = createBlock( name, attributes, innerBlocks );
	return (
		<Disabled className="editor-block-preview__content block-editor-block-preview__content editor-styles-wrapper" aria-hidden>
			<BlockEditorProvider
				value={ [ block ] }
				settings={ settings }
			>
				<BlockList />
			</BlockEditorProvider>
		</Disabled>
	);
}

export default withSelect( ( select ) => {
	return {
		settings: select( 'core/block-editor' ).getSettings(),
	};
} )( BlockPreview );
