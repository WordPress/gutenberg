/**
 * WordPress dependencies
 */
import { useState, useRef, useEffect } from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import BlockPopover from '../components/block-popover';
import { __unstableUseBlockElement as useBlockElement } from '../components/block-list/use-block-props/use-block-refs';

function getComputedCSS( element, property ) {
	return element.ownerDocument.defaultView
		.getComputedStyle( element )
		.getPropertyValue( property );
}

export function MarginVisualizer( { clientId, attributes, forceShow } ) {
	const blockElement = useBlockElement( clientId );
	const [ style, setStyle ] = useState();

	const margin = attributes?.style?.spacing?.margin;

	useEffect( () => {
		if ( ! blockElement ) {
			return;
		}

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
	}, [ blockElement, margin ] );

	const [ isActive, setIsActive ] = useState( false );
	const valueRef = useRef( margin );
	const timeoutRef = useRef();

	const clearTimer = () => {
		if ( timeoutRef.current ) {
			window.clearTimeout( timeoutRef.current );
		}
	};

	useEffect( () => {
		if ( ! isShallowEqual( margin, valueRef.current ) && ! forceShow ) {
			setIsActive( true );
			valueRef.current = margin;

			timeoutRef.current = setTimeout( () => {
				setIsActive( false );
			}, 400 );
		}

		return () => {
			setIsActive( false );
			clearTimer();
		};
	}, [ margin, forceShow ] );

	if ( ! isActive && ! forceShow ) {
		return null;
	}

	return (
		<BlockPopover
			clientId={ clientId }
			__unstableCoverTarget
			__unstableRefreshSize={ margin }
			__unstablePopoverSlot="block-toolbar"
			shift={ false }
		>
			<div className="block-editor__padding-visualizer" style={ style } />
		</BlockPopover>
	);
}
