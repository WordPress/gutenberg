/**
 * External dependencies
 */
import { castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { Disabled } from '@wordpress/components';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockEditorProvider from '../provider';
import BlockList from '../block-list';

export function BlockPreview( { blocks, settings, srcWidth, srcHeight, destWidth } ) {
	if ( ! blocks ) {
		return null;
	}

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

	return (
		<div style={ previewAspect } className="editor-block-preview__container" aria-hidden>
			<Disabled style={ previewDimensions } className="editor-block-preview__content block-editor-block-preview__content editor-styles-wrapper">
				<BlockEditorProvider
					value={ castArray( blocks ) }
					settings={ settings }
				>
					<BlockList />
				</BlockEditorProvider>
			</Disabled>
		</div>
	);
}

/**
 * BlockPreview renders a preview given an array of blocks.
 *
 * @param {Object} props Component props.
 *
 * @return {WPElement} Rendered element.
 */
export default withSelect( ( select ) => {
	return {
		settings: select( 'core/block-editor' ).getSettings(),
	};
} )( BlockPreview );
