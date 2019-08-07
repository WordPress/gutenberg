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
import { useLayoutEffect, useState, useRef, useReducer, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockEditorProvider from '../provider';
import BlockList from '../block-list';
import { getBlockPreviewContainerDOMNode } from '../../utils/dom';

const PREVIEW_CONTAINER_WIDTH = 700;

function ScaledBlockPreview( { blocks } ) {
	const previewRef = useRef( null );

	const [ isTallPreview, setIsTallPreview ] = useState( false );
	const [ isReady, setIsReady ] = useState( false );
	const [ previewScale, setPreviewScale ] = useState( 1 );
	const [ xPosition, setXPosition ] = useState( 0 );

	// Dynamically calculate the scale factor
	useLayoutEffect( () => {
		// Timer - required to account for async render of `BlockEditorProvider`
		const timerId = setTimeout( () => {
			const containerElement = previewRef.current;
			if ( ! containerElement ) {
				return;
			}

			// If we're previewing a single block, scale the preview to fit it.
			if ( ! blocks.length !== 1 ) {
				const block = blocks[ 0 ];
				const previewElement = getBlockPreviewContainerDOMNode( block.clientId, containerElement );
				if ( ! previewElement ) {
					return;
				}

				const containerElementRect = containerElement.getBoundingClientRect();
				const scaledElementRect = previewElement.getBoundingClientRect();

				const scale = containerElementRect.width / scaledElementRect.width || 1;
				const offsetX = scaledElementRect.left - containerElementRect.left;

				setIsTallPreview( scaledElementRect.height * scale > containerElementRect.height );
				setPreviewScale( scale );
				setXPosition( offsetX * scale );
			} else {
				const containerElementRect = containerElement.getBoundingClientRect();
				setPreviewScale( containerElementRect.width / PREVIEW_CONTAINER_WIDTH );
				setIsTallPreview( true );
			}

			setIsReady( true );
		}, 100 );

		// Cleanup
		return () => {
			if ( timerId ) {
				window.clearTimeout( timerId );
			}
		};
	}, [] );

	if ( ! blocks || blocks.length === 0 ) {
		return null;
	}

	const previewStyles = {
		transform: `scale(${ previewScale })`,
		visibility: isReady ? 'visible' : 'hidden',
		left: -xPosition,
		width: PREVIEW_CONTAINER_WIDTH,
	};

	const contentClassNames = classnames( 'block-editor-block-preview__content editor-styles-wrapper', {
		'is-tall-preview': isTallPreview,
		'is-ready': isReady,
	} );

	return (
		<div ref={ previewRef } className="block-editor-block-preview__container" aria-hidden>
			<Disabled style={ previewStyles } className={ contentClassNames }>
				<BlockList />
			</Disabled>
		</div>
	);
}

export function BlockPreview( { blocks, settings } ) {
	const renderedBlocks = useMemo( () => castArray( blocks ), [ blocks ] );
	const [ recompute, triggerRecompute ] = useReducer( ( state ) => state + 1 );
	useLayoutEffect( triggerRecompute, [ blocks ] );

	return (
		<BlockEditorProvider
			value={ renderedBlocks }
			settings={ settings }
		>
			{
				/*
				 * The key prop is used to force recomputing the preview
				 * by remounting the component, ScaledBlockPreview is not meant to
				 * be rerendered.
				 */
			}
			<ScaledBlockPreview key={ recompute } blocks={ renderedBlocks } />
		</BlockEditorProvider>
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
