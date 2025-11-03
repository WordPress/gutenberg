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

		const blockElement = blockRef.current;

		// Get or create style element with unique ID
		const styleId = `fit-text-${ clientId }`;
		let styleElement = blockElement.ownerDocument.getElementById( styleId );
		if ( ! styleElement ) {
			styleElement = blockElement.ownerDocument.createElement( 'style' );
			styleElement.id = styleId;
			blockElement.ownerDocument.head.appendChild( styleElement );
		}

		const blockSelector = `#block-${ clientId }`;

		const applyFontSize = ( fontSize ) => {
			if ( fontSize === 0 ) {
				styleElement.textContent = '';
			} else {
				styleElement.textContent = `${ blockSelector } { font-size: ${ fontSize }px !important; }`;
			}
		};

		optimizeFitText( blockElement, applyFontSize );
	}, [ clientId ] );

	useEffect( () => {
		if ( ! blockRef.current || ! clientId ) {
			return;
		}

		const currentElement = blockRef.current;

		applyFitText();

		// Watch for size changes
		let resizeObserver;
		if ( window.ResizeObserver && currentElement.parentElement ) {
			resizeObserver = new window.ResizeObserver( applyFitText );
			resizeObserver.observe( currentElement.parentElement );
		}

		// Cleanup function
		return () => {
			if ( resizeObserver ) {
				resizeObserver.disconnect();
			}

			const styleId = `fit-text-${ clientId }`;
			const styleElement =
				currentElement.ownerDocument.getElementById( styleId );
			if ( styleElement ) {
				styleElement.remove();
			}
		};
	}, [ clientId, applyFitText ] );

	// Trigger fit text recalculation when content changes
	useLayoutEffect( () => {
		if ( blockRef.current ) {
			applyFitText();
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
