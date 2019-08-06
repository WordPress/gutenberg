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
import { getBlockPreviewContainerDOMNode } from '../../utils/dom';

export function BlockPreview( {
	blocks,
	settings,
	scaleToFit = true,
	isScaled = true,
} ) {
	blocks = castArray( blocks );

	const previewRef = useRef( null );

	const [ isTallPreview, setIsTallPreview ] = useState( false );
	const [ previewScale, setPreviewScale ] = useState( 1 );
	const [ visibility, setVisibility ] = useState( 'hidden' );
	const [ xPosition, setXPosition ] = useState( 0 );

	// Dynamically calculate the scale factor
	useLayoutEffect( () => {
		if ( ! scaleToFit ) {
			setVisibility( 'visible' );
			return;
		}

		// Timer - required to account for async render of `BlockEditorProvider`
		const timerId = setTimeout( () => {
			window.clearTimeout( timerId );
			const containerElement = previewRef.current;

			if ( ! containerElement ) {
				return;
			}

			// comparisonBlock
			const block = blocks[ 0 ];
			const previewElement = getBlockPreviewContainerDOMNode( block.clientId, containerElement );

			if ( previewElement ) {
				// Get dimensions.
				const containerElementWidth = containerElement.offsetWidth;
				const containerElementHeight = containerElement.offsetHeight;
				const previewElementHeight = previewElement.offsetHeight;
				const previewElementWidth = previewElement.offsetWidth;

				const scale = containerElementWidth / previewElementWidth || 1;

				// Compute left position.
				const scaledElementRect = previewElement.getBoundingClientRect();
				const containerElementRect = containerElement.getBoundingClientRect();
				const offsetX = scaledElementRect.left - containerElementRect.left;

				setIsTallPreview( previewElementHeight > containerElementHeight );
				setPreviewScale( scale );
				// setXPosition( offsetX );
				setVisibility( 'visible' );
			}
		}, 10 );

		// Cleanup
		return () => {
			if ( timerId ) {
				window.clearTimeout( timerId );
			}
		};
	} );

	if ( ! blocks ) {
		return null;
	}

	const previewStyles = {
		transform: `scale(${ previewScale }) translate(-50%, -50%)`,
		visibility,
		// left: xPosition,
	};

	if ( isTallPreview ) {
		previewStyles.transform = `scale(${ previewScale }) translate(-50%, 0)`;
	}

	const contentClassNames = classnames( 'editor-block-preview__content block-editor-block-preview__content editor-styles-wrapper', {
		'is-scaled': isScaled,
		'is-tall-preview': isTallPreview,
		'is-scaled-auto': visibility === 'visible',
	} );

	return (
		<div ref={ previewRef } className="editor-block-preview__container" aria-hidden>
			<Disabled style={ previewStyles } className={ contentClassNames }>
				<BlockEditorProvider
					value={ blocks }
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
