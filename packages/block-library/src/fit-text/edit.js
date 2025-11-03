/**
 * External dependencies
 */
import clsx from 'clsx';

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
import { useSelect } from '@wordpress/data';
import {
	RichText,
	AlignmentControl,
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
	const { level, levelOptions, textAlign, content } = attributes;
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

		// Store IDs for cleanup
		let calculateTimeoutId = null;

		// Hide the element during calculation to avoid flash
		//blockRef.current.style.visibility = 'hidden';

		// Wait 100ms for DOM to fully render and layout to settle
		calculateTimeoutId = setTimeout( () => {
			applyFitText();
		}, 100 );

		// Watch for size changes
		let resizeObserver;
		if ( window.ResizeObserver && blockRef.current.parentElement ) {
			resizeObserver = new window.ResizeObserver( applyFitText );
			resizeObserver.observe( blockRef.current.parentElement );
		}

		// Cleanup function
		return () => {
			// Cancel pending async operations
			if ( calculateTimeoutId !== null ) {
				clearTimeout( calculateTimeoutId );
			}

			if ( resizeObserver ) {
				resizeObserver.disconnect();
			}

			const styleId = `fit-text-${ clientId }`;
			const styleElement =
				blockRef.current.ownerDocument.getElementById( styleId );
			if ( styleElement ) {
				styleElement.remove();
			}
		};
	}, [ clientId, applyFitText ] );

	// Trigger fit text recalculation when content changes
	useLayoutEffect( () => {
		if ( blockRef.current ) {
			// Wait 100ms for DOM layout to settle (especially for alignment changes)
			const timeoutId = setTimeout( () => {
				if ( blockRef.current ) {
					applyFitText();
				}
			}, 100 );

			return () => clearTimeout( timeoutId );
		}
	}, [ attributes, applyFitText ] );

	const tagName = level === 0 ? 'p' : `h${ level }`;
	const blockProps = useBlockProps( {
		ref: blockRef,
		className: clsx( 'has-fit-text', {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
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
					<AlignmentControl
						value={ textAlign }
						onChange={ ( nextAlign ) => {
							setAttributes( { textAlign: nextAlign } );
						} }
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
