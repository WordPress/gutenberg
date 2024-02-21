/**
 * WordPress dependencies
 */
import {
	useState,
	useRef,
	useLayoutEffect,
	useEffect,
} from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import BlockPopoverCover from '../components/block-popover/cover';
import { __unstableUseBlockElement as useBlockElement } from '../components/block-list/use-block-props/use-block-refs';

function getComputedCSS( element, property ) {
	return element.ownerDocument.defaultView
		.getComputedStyle( element )
		.getPropertyValue( property );
}

export function MarginVisualizer( { clientId, value, forceShow } ) {
	const blockElement = useBlockElement( clientId );
	const [ style, setStyle ] = useState();

	const margin = value?.spacing?.margin;

	useLayoutEffect( () => {
		if ( ! blockElement ) {
			return;
		}
		// It's not sufficient to read the computed padding value when value.spacing.padding
		// changes as useEffect may run before the browser recomputes CSS and paints, and,
		// unlike padding, there's no way to observe when the margin changes using ResizeObserver.
		// We therefore combine useLayoutEffect and two rAF calls to ensure that we read the margin
		// after the current paint but before the next paint.
		window.requestAnimationFrame( () =>
			window.requestAnimationFrame( () => {
				const top = getComputedCSS( blockElement, 'margin-top' );
				const right = getComputedCSS( blockElement, 'margin-right' );
				const bottom = getComputedCSS( blockElement, 'margin-bottom' );
				const left = getComputedCSS( blockElement, 'margin-left' );
				setStyle( {
					borderTopWidth: top,
					borderRightWidth: right,
					borderBottomWidth: bottom,
					borderLeftWidth: left,
					top: top ? `-${ top }` : 0,
					right: right ? `-${ right }` : 0,
					bottom: bottom ? `-${ bottom }` : 0,
					left: left ? `-${ left }` : 0,
				} );
			} )
		);
	}, [ blockElement, margin ] );

	const previousMargin = useRef( margin );
	const [ isActive, setIsActive ] = useState( false );

	useEffect( () => {
		if ( isShallowEqual( margin, previousMargin.current ) || forceShow ) {
			return;
		}

		setIsActive( true );
		previousMargin.current = margin;

		const timeout = setTimeout( () => {
			setIsActive( false );
		}, 400 );

		return () => {
			setIsActive( false );
			clearTimeout( timeout );
		};
	}, [ margin, forceShow ] );

	if ( ! isActive && ! forceShow ) {
		return null;
	}

	return (
		<BlockPopoverCover
			clientId={ clientId }
			__unstablePopoverSlot="block-toolbar"
		>
			<div className="block-editor__padding-visualizer" style={ style } />
		</BlockPopoverCover>
	);
}
