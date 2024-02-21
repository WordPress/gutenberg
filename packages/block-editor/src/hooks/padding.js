/**
 * WordPress dependencies
 */
import { useState, useRef, useEffect } from '@wordpress/element';
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

export function PaddingVisualizer( { clientId, value, forceShow } ) {
	const blockElement = useBlockElement( clientId );
	const [ style, setStyle ] = useState();

	useEffect( () => {
		if ( ! blockElement ) {
			return;
		}
		// It's not sufficient to read the computed padding value when value.spacing.padding
		// changes as useEffect may run before the browser recomputes CSS and paints. Instead,
		// we use a ResizeObserver with the box option set to 'border-box' to listen out for
		// changes to the padding.
		const observer = new window.ResizeObserver( () => {
			setStyle( {
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
			} );
		} );
		observer.observe( blockElement, { box: 'border-box' } );
		return () => observer.disconnect();
	}, [ blockElement ] );

	const padding = value?.spacing?.padding;
	const previousPadding = useRef( padding );
	const [ isActive, setIsActive ] = useState( false );

	useEffect( () => {
		if ( isShallowEqual( padding, previousPadding.current ) || forceShow ) {
			return;
		}

		setIsActive( true );
		previousPadding.current = padding;

		const timeout = setTimeout( () => {
			setIsActive( false );
		}, 400 );

		return () => {
			setIsActive( false );
			clearTimeout( timeout );
		};
	}, [ padding, forceShow ] );

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
