/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useEffect,
	useLayoutEffect,
	useCallback,
	useRef,
} from '@wordpress/element';
import {
	RichText,
	BlockControls,
	useBlockProps,
	HeadingLevelDropdown,
	useBlockEditingMode,
} from '@wordpress/block-editor';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { optimizeFitText } from './utils';

export default function FitTextEdit( {
	attributes,
	setAttributes,
	insertBlocksAfter,
	clientId,
} ) {
	const { level, levelOptions, content } = attributes;
	const blockEditingMode = useBlockEditingMode();
	const blockRef = useRef();

	const applyFitText = useCallback( () => {
		if ( ! blockRef.current ) {
			return;
		}

		// Get or create style element with unique ID
		const styleId = `fit-text-${ clientId }`;
		let styleElement =
			blockRef.current.ownerDocument.getElementById( styleId );
		if ( ! styleElement ) {
			styleElement =
				blockRef.current.ownerDocument.createElement( 'style' );
			styleElement.id = styleId;
			blockRef.current.ownerDocument.head.appendChild( styleElement );
		}

		const blockSelector = `#block-${ clientId }`;

		const applyFontSize = ( fontSize ) => {
			if ( fontSize === 0 ) {
				styleElement.textContent = '';
			} else {
				styleElement.textContent = `${ blockSelector } { font-size: ${ fontSize }px !important; }`;
			}
		};

		optimizeFitText( blockRef.current, applyFontSize );
	}, [ clientId ] );

	useEffect( () => {
		if ( ! blockRef.current || ! clientId ) {
			return;
		}

		let calculateFrameId = null;

		// Wait for next animation frame for DOM to fully render and layout to settle
		calculateFrameId = window.requestAnimationFrame( () => {
			applyFitText();
		} );

		// Watch for size changes
		let resizeObserver;
		if ( window.ResizeObserver && blockRef.current.parentElement ) {
			resizeObserver = new window.ResizeObserver( applyFitText );
			resizeObserver.observe( blockRef.current.parentElement );
		}

		const blockRefToCleanup = blockRef.current;

		// Cleanup function
		return () => {
			if ( calculateFrameId !== null ) {
				window.cancelAnimationFrame( calculateFrameId );
			}

			if ( resizeObserver ) {
				resizeObserver.disconnect();
			}

			const styleId = `fit-text-${ clientId }`;
			const styleElement =
				blockRefToCleanup.ownerDocument.getElementById( styleId );
			if ( styleElement ) {
				styleElement.remove();
			}
		};
	}, [ clientId, applyFitText ] );

	// Trigger fit text recalculation when attributes change
	useLayoutEffect( () => {
		if ( blockRef.current ) {
			// Wait for two animation frames for DOM layout to settle.
			// If we do it in a single frame, because of some reason when changing
			// alignment from full to wide or non things don't recompute correctly.
			let firstFrameId = null;
			let secondFrameId = null;

			firstFrameId = window.requestAnimationFrame( () => {
				secondFrameId = window.requestAnimationFrame( () => {
					if ( blockRef.current ) {
						applyFitText();
					}
				} );
			} );

			return () => {
				if ( firstFrameId !== null ) {
					window.cancelAnimationFrame( firstFrameId );
				}
				if ( secondFrameId !== null ) {
					window.cancelAnimationFrame( secondFrameId );
				}
			};
		}
	}, [ attributes, applyFitText ] );

	const tagName = level === 0 ? 'p' : `h${ level }`;
	const blockProps = useBlockProps( {
		ref: blockRef,
	} );

	return (
		<>
			{ blockEditingMode === 'default' && (
				<BlockControls group="block">
					<HeadingLevelDropdown
						value={ level }
						options={ levelOptions }
						onChange={ ( newLevel ) =>
							setAttributes( { level: newLevel } )
						}
					/>
				</BlockControls>
			) }
			<RichText
				{ ...blockProps }
				tagName={ tagName }
				aria-label={ __( 'Fit text' ) }
				placeholder={ __( 'Add text…' ) }
				value={ content }
				onChange={ ( value ) => setAttributes( { content: value } ) }
				allowedFormats={ [] }
				disableLineBreaks
				__unstableOnSplitAtEnd={ () =>
					insertBlocksAfter( createBlock( getDefaultBlockName() ) )
				}
			/>
		</>
	);
}
