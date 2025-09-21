/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import {
	InnerBlocks,
	useBlockProps,
	InspectorControls,
	useInnerBlocksProps,
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { useRef, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { View } from '@wordpress/primitives';
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import GroupPlaceHolder, { useShouldShowPlaceHolder } from './placeholder';
import { unlock } from '../lock-unlock';

const { HTMLElementControl } = unlock( blockEditorPrivateApis );

/**
 * Custom hook for stretchy text functionality in the editor.
 *
 * @param {Object}  ref          React ref to the container element.
 * @param {boolean} stretchyText Whether stretchy text is enabled.
 * @param {string}  clientId     The WordPress block client ID.
 * @return {void}
 */
function useStretchyText( ref, stretchyText, clientId ) {
	const [ dynamicStyleElement, setDynamicStyleElement ] = useState( null );

	useEffect( () => {
		if ( ! stretchyText || ! ref.current || ! clientId ) {
			return;
		}

		// Use WordPress block ID for targeting
		const blockSelector = `#block-${ clientId }`;

		// Create or get dynamic style element
		let styleElement = dynamicStyleElement;
		if ( ! styleElement ) {
			styleElement = ref.current.ownerDocument.createElement( 'style' );
			ref.current.ownerDocument.head.appendChild( styleElement );
			setDynamicStyleElement( styleElement );
		}

		// Define block pattern for clearing styles
		const blockPattern = new RegExp( `#block-${ clientId }[^}]*}`, 'g' );

		// Apply stretchy text logic
		const applyStretchyText = () => {
			if ( ! ref.current ) {
				return;
			}

			// Clear any existing dynamic styles for this block FIRST
			// This ensures we measure natural CSS font sizes, not previously stretched sizes
			styleElement.textContent = styleElement.textContent.replace(
				blockPattern,
				''
			);

			// Find text elements each time (they may have been added/removed)
			const textElements = ref.current.querySelectorAll(
				'h1, h2, h3, h4, h5, h6, p'
			);

			// If no text elements, styles are already cleared above, so return
			if ( textElements.length === 0 ) {
				return;
			}

			// Calculate font ratios for current text elements (now at natural CSS sizes)
			const elementSizes = [];
			let minSize = Infinity;

			textElements.forEach( ( element ) => {
				const computedStyle = window.getComputedStyle( element );
				const fontSize = parseFloat( computedStyle.fontSize );
				elementSizes.push( fontSize );
				minSize = Math.min( minSize, fontSize );
			} );

			// Calculate ratios relative to smallest font size
			const fontRatios = elementSizes.map(
				( fontSize ) => fontSize / minSize
			);

			let minTestSize = 1;
			let maxTestSize = 100;
			let bestSize = minTestSize;

			// Binary search for optimal base font size
			while ( minTestSize <= maxTestSize ) {
				const midSize = Math.floor( ( minTestSize + maxTestSize ) / 2 );

				// Generate CSS rules for this test
				let cssRules = '';
				fontRatios.forEach( ( ratio, index ) => {
					const fontSize = midSize * ratio;
					const selector = `${ blockSelector } > *:nth-child(${
						index + 1
					})`;
					cssRules += `${ selector } { font-size: ${ fontSize }px !important; }\n`;
				} );

				// Apply test styles
				const existingContent = styleElement.textContent || '';
				const newContent =
					existingContent.replace( blockPattern, '' ) + cssRules;
				styleElement.textContent = newContent;

				const fitsWidth =
					ref.current.scrollWidth <= ref.current.clientWidth;
				const fitsHeight =
					ref.current.scrollHeight <= ref.current.clientHeight;

				if ( fitsWidth && fitsHeight ) {
					bestSize = midSize;
					minTestSize = midSize + 1;
				} else {
					maxTestSize = midSize - 1;
				}
			}

			// Apply final optimal sizes
			let finalCssRules = '';
			fontRatios.forEach( ( ratio, index ) => {
				const fontSize = bestSize * ratio;
				const selector = `${ blockSelector } > *:nth-child(${
					index + 1
				})`;
				finalCssRules += `${ selector } { font-size: ${ fontSize }px !important; }\n`;
			} );

			const existingContent = styleElement.textContent || '';
			const newContent =
				existingContent.replace( blockPattern, '' ) + finalCssRules;
			styleElement.textContent = newContent;
		};

		// Apply initially and set up observer
		applyStretchyText();

		// Store current ref value for cleanup
		const currentRef = ref.current;

		// Watch for size changes
		let resizeObserver;
		if ( window.ResizeObserver ) {
			resizeObserver = new window.ResizeObserver( applyStretchyText );
			resizeObserver.observe( currentRef );
		}

		// Watch for content changes (when user adds/edits blocks)
		const mutationObserver = new window.MutationObserver(
			applyStretchyText
		);
		mutationObserver.observe( currentRef, {
			childList: true,
			subtree: true,
			characterData: true,
			attributes: true,
		} );

		// Cleanup function
		return () => {
			if ( resizeObserver ) {
				resizeObserver.disconnect();
			}
			mutationObserver.disconnect();

			// Clean up styles for this block
			if ( styleElement && styleElement.textContent ) {
				const existingContent = styleElement.textContent;
				const newContent = existingContent.replace( blockPattern, '' );
				styleElement.textContent = newContent;
			}
		};
	}, [ stretchyText, clientId, dynamicStyleElement ] );
}

/**
 * Render inspector controls for the Group block.
 *
 * @param {Object}   props                 Component props.
 * @param {string}   props.tagName         The HTML tag name.
 * @param {Function} props.onSelectTagName onChange function for the SelectControl.
 * @param {string}   props.clientId        The client ID of the current block.
 *
 * @return {JSX.Element}                The control group.
 */
function GroupEditControls( { tagName, onSelectTagName, clientId } ) {
	return (
		<InspectorControls group="advanced">
			<HTMLElementControl
				tagName={ tagName }
				onChange={ onSelectTagName }
				clientId={ clientId }
				options={ [
					{ label: __( 'Default (<div>)' ), value: 'div' },
					{ label: '<header>', value: 'header' },
					{ label: '<main>', value: 'main' },
					{ label: '<section>', value: 'section' },
					{ label: '<article>', value: 'article' },
					{ label: '<aside>', value: 'aside' },
					{ label: '<footer>', value: 'footer' },
				] }
			/>
		</InspectorControls>
	);
}

function GroupEdit( { attributes, name, setAttributes, clientId } ) {
	const { hasInnerBlocks, themeSupportsLayout } = useSelect(
		( select ) => {
			const { getBlock, getSettings } = select( blockEditorStore );
			const block = getBlock( clientId );
			return {
				hasInnerBlocks: !! ( block && block.innerBlocks.length ),
				themeSupportsLayout: getSettings()?.supportsLayout,
			};
		},
		[ clientId ]
	);

	const {
		tagName: TagName = 'div',
		templateLock,
		allowedBlocks,
		layout = {},
		stretchyText = false,
	} = attributes;

	// Layout settings.
	const { type = 'default' } = layout;
	const layoutSupportEnabled =
		themeSupportsLayout || type === 'flex' || type === 'grid';

	// Hooks.
	const ref = useRef();
	const blockProps = useBlockProps( {
		ref,
		className: clsx( {
			'has-stretch-text': stretchyText,
		} ),
	} );

	// Apply stretchy text functionality in the editor
	useStretchyText( ref, stretchyText, clientId );

	const [ showPlaceholder, setShowPlaceholder ] = useShouldShowPlaceHolder( {
		attributes,
		usedLayoutType: type,
		hasInnerBlocks,
	} );

	// Default to the regular appender being rendered.
	let renderAppender;
	if ( showPlaceholder ) {
		// In the placeholder state, ensure the appender is not rendered.
		// This is needed because `...innerBlocksProps` is used in the placeholder
		// state so that blocks can dragged onto the placeholder area
		// from both the list view and in the editor canvas.
		renderAppender = false;
	} else if ( ! hasInnerBlocks ) {
		// When there is no placeholder, but the block is also empty,
		// use the larger button appender.
		renderAppender = InnerBlocks.ButtonBlockAppender;
	}

	const innerBlocksProps = useInnerBlocksProps(
		layoutSupportEnabled
			? blockProps
			: { className: 'wp-block-group__inner-container' },
		{
			dropZoneElement: ref.current,
			templateLock,
			allowedBlocks,
			renderAppender,
		}
	);

	const { selectBlock } = useDispatch( blockEditorStore );

	const selectVariation = ( nextVariation ) => {
		setAttributes( nextVariation.attributes );
		selectBlock( clientId, -1 );
		setShowPlaceholder( false );
	};

	return (
		<>
			<GroupEditControls
				tagName={ TagName }
				onSelectTagName={ ( value ) =>
					setAttributes( { tagName: value } )
				}
				clientId={ clientId }
			/>
			{ showPlaceholder && (
				<View>
					{ innerBlocksProps.children }
					<GroupPlaceHolder
						name={ name }
						onSelect={ selectVariation }
					/>
				</View>
			) }
			{ layoutSupportEnabled && ! showPlaceholder && (
				<TagName { ...innerBlocksProps } />
			) }
			{ /* Ideally this is not needed but it's there for backward compatibility reason
				to keep this div for themes that might rely on its presence */ }
			{ ! layoutSupportEnabled && ! showPlaceholder && (
				<TagName { ...blockProps }>
					<div { ...innerBlocksProps } />
				</TagName>
			) }
		</>
	);
}

export default GroupEdit;
