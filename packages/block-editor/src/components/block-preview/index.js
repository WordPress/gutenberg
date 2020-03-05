/**
 * External dependencies
 */
import { castArray, noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Disabled } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import {
	useLayoutEffect,
	useState,
	useRef,
	useReducer,
	useMemo,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockEditorProvider from '../provider';
import BlockList from '../block-list';
import { getBlockPreviewContainerDOMNode } from '../../utils/dom';

const getInlineStyles = ( scale, x, y, isReady, width ) => ( {
	transform: `scale(${ scale })`,
	visibility: isReady ? 'visible' : 'hidden',
	left: x,
	top: y,
	width,
} );

function ScaledBlockPreview( {
	blocks,
	viewportWidth,
	padding = 0,
	onReady,
	scalingDelay,
} ) {
	const previewRef = useRef( null );

	const [ isReady, setIsReady ] = useState( false );
	const [ previewScale, setPreviewScale ] = useState( 1 );
	const [ { x, y }, setPosition ] = useState( { x: 0, y: 0 } );

	// Dynamically calculate the scale factor
	useLayoutEffect( () => {
		// Timer - required to account for async render of `BlockEditorProvider`
		const timerId = setTimeout( () => {
			const containerElement = previewRef.current;
			if ( ! containerElement ) {
				return;
			}

			// Auxiliary vars used for onReady() callback.
			let scale,
				offsetX = 0,
				offsetY = 0;

			// If we're previewing a single block, scale the preview to fit it.
			if ( blocks.length === 1 ) {
				const block = blocks[ 0 ];
				const previewElement = getBlockPreviewContainerDOMNode(
					block.clientId
				);
				if ( ! previewElement ) {
					return;
				}

				let containerElementRect = containerElement.getBoundingClientRect();
				containerElementRect = {
					width: containerElementRect.width - padding * 2,
					height: containerElementRect.height - padding * 2,
					left: containerElementRect.left,
					top: containerElementRect.top,
				};
				const scaledElementRect = previewElement.getBoundingClientRect();

				scale =
					containerElementRect.width / scaledElementRect.width || 1;
				offsetX =
					-( scaledElementRect.left - containerElementRect.left ) *
						scale +
					padding;
				offsetY =
					containerElementRect.height >
					scaledElementRect.height * scale
						? ( containerElementRect.height -
								scaledElementRect.height * scale ) /
								2 +
						  padding
						: 0;

				setPreviewScale( scale );
				setPosition( { x: offsetX, y: offsetY } );

				// Hack: we need  to reset the scaled elements margins
				previewElement.style.marginTop = '0';
			} else {
				const containerElementRect = containerElement.getBoundingClientRect();
				scale = containerElementRect.width / viewportWidth;
				setPreviewScale( scale );
			}

			setIsReady( true );
			onReady( {
				scale,
				position: { x: offsetX, y: offsetY },
				previewContainerRef: previewRef,

				inlineStyles: getInlineStyles(
					scale,
					offsetX,
					offsetY,
					true,
					viewportWidth
				),
			} );
		}, scalingDelay );

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

	const previewStyles = getInlineStyles(
		previewScale,
		x,
		y,
		isReady,
		viewportWidth
	);

	return (
		<div
			ref={ previewRef }
			className={ classnames(
				'block-editor-block-preview__container editor-styles-wrapper',
				{
					'is-ready': isReady,
				}
			) }
			aria-hidden
		>
			<Disabled
				style={ previewStyles }
				className="block-editor-block-preview__content"
			>
				<BlockList />
			</Disabled>
		</div>
	);
}

export function BlockPreview( {
	blocks,
	viewportWidth = 700,
	padding,
	settings,
	__experimentalOnReady = noop,
	__experimentalScalingDelay = 100,
} ) {
	const renderedBlocks = useMemo( () => castArray( blocks ), [ blocks ] );
	const [ recompute, triggerRecompute ] = useReducer(
		( state ) => state + 1,
		0
	);
	useLayoutEffect( triggerRecompute, [ blocks ] );
	return (
		<BlockEditorProvider value={ renderedBlocks } settings={ settings }>
			{ /*
			 * The key prop is used to force recomputing the preview
			 * by remounting the component, ScaledBlockPreview is not meant to
			 * be rerendered.
			 */ }
			<ScaledBlockPreview
				key={ recompute }
				blocks={ renderedBlocks }
				viewportWidth={ viewportWidth }
				padding={ padding }
				onReady={ __experimentalOnReady }
				scalingDelay={ __experimentalScalingDelay }
			/>
		</BlockEditorProvider>
	);
}

/**
 * BlockPreview renders a preview of a block or array of blocks.
 *
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/block-preview/README.md
 *
 * @param {Array|Object} blocks A block instance (object) or an array of blocks to be previewed.
 * @param {number} viewportWidth Width of the preview container in pixels. Controls at what size the blocks will be rendered inside the preview. Default: 700.
 * @return {WPComponent} The component to be rendered.
 */
export default withSelect( ( select ) => {
	return {
		settings: select( 'core/block-editor' ).getSettings(),
	};
} )( BlockPreview );
