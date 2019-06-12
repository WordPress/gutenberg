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
			<BlockPreviewContent { ...props } srcWidth={ 280 } srcHeight={ 300 } destWidth={ 280 } />
		</div>
	);
}

export function BlockPreviewContent( { name, attributes, innerBlocks, settings, srcWidth, srcHeight, destWidth } ) {
	// Todo: It would be nice if destWidth could be calculated here, that's the only missing piece ot making this fully responsive.

	// Calculate the scale factor necessary to size down the preview thumbnail.
	const scale = Math.min( destWidth / srcWidth );
	const previewDimensions = {
		width: srcWidth ? srcWidth : 400 + 'px', // 400x300 is provided as a 4:3 aspect ratio fallback.
		height: srcHeight ? srcHeight : 300 + 'px',
		transform: 'scale(' + scale + ')',
	};

	// We use a top-padding to create a responsively sized element with the same aspect ratio as the preview.
	// The preview is then absolutely positioned on top of this, creating a visual unit.
	const aspectPadding = Math.round( srcHeight / srcWidth * 100 );
	const previewAspect = {
		paddingTop: aspectPadding + '%',
	};

	const block = createBlock( name, attributes, innerBlocks );
	return (
		<div style={ previewAspect } className="editor-block-preview__container" aria-hidden>
			<Disabled style={ previewDimensions } className="editor-block-preview__content block-editor-block-preview__content editor-styles-wrapper">
				<BlockEditorProvider
					value={ [ block ] }
					settings={ settings }
				>
					<BlockList />
				</BlockEditorProvider>
			</Disabled>
		</div>
	);
}

export default withSelect( ( select ) => {
	return {
		settings: select( 'core/block-editor' ).getSettings(),
	};
} )( BlockPreview );
