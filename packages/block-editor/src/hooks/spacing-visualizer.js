/**
 * WordPress dependencies
 */
import {
	useState,
	useRef,
	useLayoutEffect,
	useEffect,
	useReducer,
} from '@wordpress/element';
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

	useLayoutEffect( () => {
		if ( ! blockElement ) {
			return;
		}
		// It's not sufficient to read the computed spacing value when value.spacing changes as
		// useEffect may run before the browser recomputes CSS. We therefore combine
		// useLayoutEffect and two rAF calls to ensure that we read the spacing after the current
		// paint but before the next paint.
		// See https://github.com/WordPress/gutenberg/pull/59227.
		window.requestAnimationFrame( () =>
			window.requestAnimationFrame( updateStyle )
		);
	}, [ blockElement, value ] );

	const previousValue = useRef( value );
	const [ isActive, setIsActive ] = useState( false );

	useEffect( () => {
		if ( isShallowEqual( value, previousValue.current ) || forceShow ) {
			return;
		}

		setIsActive( true );
		previousValue.current = value;

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
