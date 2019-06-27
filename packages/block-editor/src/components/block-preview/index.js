/**
 * WordPress dependencies
 */
/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import { Disabled } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { useLayoutEffect, useState } from '@wordpress/element';

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
			<BlockPreviewContent { ...props } srcWidth={ 560 } srcHeight={ 700 } />
		</div>
	);
}

export function BlockPreviewContent( { name, attributes, innerBlocks, settings, srcWidth, srcHeight } = {} ) {
	// Calculated the destination width.
	const previewRef = React.createRef();

	// Fallback dimensions.
	const [ previewDimensions, setPreviewDimensions ] = useState( {
		width: 400,
		height: 300,
		transform: 'scale(1)',
	} );

	const [ previewAspect, setPreviewAspect ] = useState( {
		paddingTop: '75%',
	} );

	useLayoutEffect( () => {
		const destWidth = previewRef.current.offsetWidth;

		// Calculate the scale factor necessary to size down the preview thumbnail.
		const scale = Math.min( destWidth / srcWidth ) || 1;

		setPreviewDimensions( {
			width: srcWidth ? srcWidth : 400 + 'px', // 400x300 is provided as a 4:3 aspect ratio fallback.
			height: srcHeight ? srcHeight : 300 + 'px',
			transform: 'scale(' + scale + ')',
		} );

		// We use a top-padding to create a responsively sized element with the same aspect ratio as the preview.
		// The preview is then absolutely positioned on top of this, creating a visual unit.
		const aspectPadding = Math.round( srcHeight / srcWidth * 100 );
		setPreviewAspect( {
			paddingTop: aspectPadding + '%',
		} );
	}, [] );

	const block = createBlock( name, attributes, innerBlocks );
	return (
		<div ref={ previewRef } style={ previewAspect } className="editor-block-preview__container" aria-hidden>
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
