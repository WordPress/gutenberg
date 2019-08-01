/**
 * External dependencies
 */

import { castArray } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Disabled } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { useLayoutEffect, useState, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockEditorProvider from '../provider';
import BlockList from '../block-list';

export function BlockPreview( { blocks, settings, srcWidth = 400, srcHeight = 300, scaleToFit = false } ) {
	if ( ! blocks ) {
		return null;
	}

	// Used to dynamically retrieve the width of the element
	// which wraps the preview
	const previewRef = useRef( null );

	const [ previewScale, setPreviewScale ] = useState( 1 );

	// We use a top-padding to create a responsively sized element with the same aspect ratio as the preview.
	// The preview is then absolutely positioned on top of this, creating a visual unit.
	const aspectPadding = {
		paddingTop: Math.round( srcHeight / srcWidth * 100 ) + '%',
	};

	// Set the predefined optimal width/height for displaying the preview
	// and scale down to fit within the preview wrapper
	const previewStyles = {
		width: `${ srcWidth }px`,
		height: `${ srcHeight }px`,
		transform: `scale(${ previewScale })`,
	};

	// Dynamically calculate the scale factor
	useLayoutEffect( () => {
		if ( ! scaleToFit ) {
			return;
		}
		// Retrieve the actual width of the element which wraps the preview
		// note: this is not the preview itself, but the wrapper element
		const destWidth = previewRef.current.offsetWidth;

		// Calculate the scale factor necessary to size down the preview thumbnail
		// so that it fits within the preview wrapper element
		const scale = Math.min( destWidth / srcWidth ) || 1;

		setPreviewScale( scale );
	}, [ srcWidth, srcHeight ] );

	const contentClassNames = classnames( 'editor-block-preview__content block-editor-block-preview__content editor-styles-wrapper', {
		'is-scaled': previewScale !== 1,
	} );

	return (
		<div ref={ previewRef } style={ aspectPadding } className="editor-block-preview__container" aria-hidden>
			<Disabled style={ previewStyles } className={ contentClassNames }>
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
