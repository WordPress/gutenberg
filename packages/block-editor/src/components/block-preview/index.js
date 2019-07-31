/**
 * External dependencies
 */

import { castArray } from 'lodash';
import classnames from 'classnames';
import root from 'react-shadow';

/**
 * WordPress dependencies
 */
import { Disabled } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { useLayoutEffect, useState, useRef, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockEditorProvider from '../provider';
import BlockList from '../block-list';

const ScaledPreview = forwardRef( ( props, ref ) => {
	return (
		<root.div className="special-wrapper-element" ref={ ref }>
			<BlockList />
		</root.div>
	);
} );

export function BlockPreview( { blocks, settings, srcWidth = 400, srcHeight = 300, allowZoom = true } ) {

	if ( ! blocks ) {
		return null;
	}

	// Used to dynamically retrieve the width of the element
	// which wraps the preview
	const previewRef = useRef( null );
	const blocksRef = useRef( null );

	const [ previewScale, setPreviewScale ] = useState( 1 );

	const [ isPreviewZoomed, setIsPreviewZoomed ] = useState( false );

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
		// Retrieve the actual width of the element which wraps the preview
		// note: this is not the preview itself, but the wrapper element
		const destWidth = previewRef.current.offsetWidth;

		// Calculate the scale factor necessary to size down the preview thumbnail
		// so that it fits within the preview wrapper element
		const scale = Math.min( destWidth / srcWidth ) || 1;

		setPreviewScale( scale );
	}, [ srcWidth, srcHeight ] );

	useLayoutEffect( () => {
		let timeout;

		if ( allowZoom && blocksRef && blocksRef.current ) {
			timeout = setTimeout( () => {
				let targetElements = Array.from( blocksRef.current.querySelectorAll( '[data-block] *' ) );

				if ( ! targetElements ) {
					return;
				}

				targetElements = targetElements.filter( ( el ) => {
					return Array.from( el.classList ).filter( ( theClass ) => theClass.includes( 'wp-block-' ) ).length;
				} );

				const largestBlockElWidth = targetElements.reduce( ( largestWidth, currrentEl ) => {
					// const elWidth = currrentEl.offsetWidth;
					let elWidth = 0;
					const computed = window.getComputedStyle( currrentEl );

					elWidth += parseFloat( computed.width );
					elWidth += parseFloat( computed.paddingLeft );
					elWidth += parseFloat( computed.paddingRight );
					elWidth += parseFloat( computed.marginLeft );
					elWidth += parseFloat( computed.marginRight );
					elWidth += parseFloat( computed.borderLeftWidth );
					elWidth += parseFloat( computed.borderRightWidth );

					largestWidth = ( elWidth > largestWidth ) ? elWidth : largestWidth;

					return largestWidth;
				}, 0 );

				if ( largestBlockElWidth ) {
					const destWidth = previewRef.current.offsetWidth;
					const scale = Math.min( destWidth / largestBlockElWidth ) || 1;

					setPreviewScale( scale );
					setIsPreviewZoomed( true );
				}
			}, 2000 );
		}

		return () => {
			if ( timeout ) {
				clearTimeout( timeout );
			}
		};
	} );

	const contentClassNames = classnames( 'editor-block-preview__content block-editor-block-preview__content editor-styles-wrapper', {
		'is-zoomed': isPreviewZoomed,
	} );

	return (
		<div ref={ previewRef } style={ aspectPadding } className="editor-block-preview__container" aria-hidden>
			<Disabled style={ previewStyles } className={ contentClassNames }>
				<BlockEditorProvider
					value={ castArray( blocks ) }
					settings={ settings }
				>
					<ScaledPreview ref={ blocksRef } />
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
