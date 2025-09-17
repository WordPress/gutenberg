/**
 * WordPress dependencies
 */
import { useState, useRef, useEffect, useReducer } from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import BlockPopoverCover from '../components/block-popover/cover';
import { useBlockElement } from '../components/block-list/use-block-props/use-block-refs';

function SpacingVisualizer( { clientId, value, computeStyle, forceShow } ) {
	const blockElement = useBlockElement( clientId );
	const [ style, updateStyle ] = useReducer( () =>
		computeStyle( blockElement )
	);

	// It's not sufficient to read the block’s computed style when `value` changes because
	// the effect would run before the block’s style has updated. Thus observing mutations
	// to the block’s attributes is used to trigger updates to the visualizer’s styles.
	useEffect( () => {
		if ( ! blockElement ) {
			return;
		}
		const observer = new window.MutationObserver( updateStyle );
		observer.observe( blockElement, {
			attributes: true,
			attributeFilter: [ 'style', 'class' ],
		} );
		return () => {
			observer.disconnect();
		};
	}, [ blockElement ] );

	const previousValueRef = useRef( value );
	const [ isActive, setIsActive ] = useState( false );

	useEffect( () => {
		if ( isShallowEqual( value, previousValueRef.current ) || forceShow ) {
			return;
		}

		setIsActive( true );
		previousValueRef.current = value;

		const timeout = setTimeout( () => {
			setIsActive( false );
		}, 400 );

		return () => {
			setIsActive( false );
			clearTimeout( timeout );
		};
	}, [ value, forceShow ] );

	if ( ! isActive && ! forceShow ) {
		return null;
	}

	return (
		<BlockPopoverCover
			clientId={ clientId }
			__unstablePopoverSlot="block-toolbar"
		>
			<div className="block-editor__spacing-visualizer" style={ style } />
		</BlockPopoverCover>
	);
}

function getComputedCSS( element, property ) {
	return element.ownerDocument.defaultView
		.getComputedStyle( element )
		.getPropertyValue( property );
}

export function MarginVisualizer( { clientId, value, forceShow } ) {
	return (
		<SpacingVisualizer
			clientId={ clientId }
			value={ value?.spacing?.margin }
			computeStyle={ ( blockElement ) => {
				const top = getComputedCSS( blockElement, 'margin-top' );
				const right = getComputedCSS( blockElement, 'margin-right' );
				const bottom = getComputedCSS( blockElement, 'margin-bottom' );
				const left = getComputedCSS( blockElement, 'margin-left' );
				return {
					borderTopWidth: top,
					borderRightWidth: right,
					borderBottomWidth: bottom,
					borderLeftWidth: left,
					top: top ? `-${ top }` : 0,
					right: right ? `-${ right }` : 0,
					bottom: bottom ? `-${ bottom }` : 0,
					left: left ? `-${ left }` : 0,
				};
			} }
			forceShow={ forceShow }
		/>
	);
}

export function PaddingVisualizer( { clientId, value, forceShow } ) {
	return (
		<SpacingVisualizer
			clientId={ clientId }
			value={ value?.spacing?.padding }
			computeStyle={ ( blockElement ) => ( {
				borderTopWidth: getComputedCSS( blockElement, 'padding-top' ),
				borderRightWidth: getComputedCSS(
					blockElement,
					'padding-right'
				),
				borderBottomWidth: getComputedCSS(
					blockElement,
					'padding-bottom'
				),
				borderLeftWidth: getComputedCSS( blockElement, 'padding-left' ),
			} ) }
			forceShow={ forceShow }
		/>
	);
}
