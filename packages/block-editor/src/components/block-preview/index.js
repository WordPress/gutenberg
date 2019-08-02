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
	scaleAdjustment = 1,
	isScaled = true,
} ) {
	blocks = castArray( blocks );

	const previewRef = useRef( null );

	const [ previewScale, setPreviewScale ] = useState( 1 );
	const [ visibility, setVisibility ] = useState( 'hidden' );

	// Dynamically calculate the scale factor
	useLayoutEffect( () => {
		if ( ! scaleToFit ) {
			return;
		}
		const blockClientIds = blocks.map( ( block ) => block.clientId );

		// Timer - required to account for async render of `BlockEditorProvider`
		const timerId = setTimeout( () => {
			window.clearTimeout( timerId );
			const previewContainerDomElement = previewRef.current;

			if ( ! previewContainerDomElement ) {
				return;
			}

			// Determine the rendered width of the container
			const previewContainerWidth = previewContainerDomElement.offsetWidth;

			const comparisonBlockWidth = blockClientIds.reduce( ( acc, currClientId ) => {
				// Selector scoped to `previewContainerDomElement` to avoid global selector being ambiguous in the case
				// of multiple previews on the same view
				const previewDomElement = getBlockPreviewContainerDOMNode( currClientId, previewContainerDomElement );

				if ( previewDomElement && previewDomElement.offsetWidth > acc ) {
					acc = previewDomElement.offsetWidth;
				}
				return acc;
			}, 0 );

			const scale = previewContainerWidth / comparisonBlockWidth || 1;

			setPreviewScale( scale );
			setVisibility( 'visible' );
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
		transform: `scale(${ previewScale * scaleAdjustment }) translate(-50%, -50%)`,
		visibility,
	};

	const contentClassNames = classnames( 'editor-block-preview__content block-editor-block-preview__content editor-styles-wrapper', {
		'is-scaled': isScaled,
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
