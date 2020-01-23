/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Tooltip } from './styles/range-control-styles';

const TOOLTIP_OFFSET_HEIGHT = 32;

export default function RangeTooltip( {
	inputRef,
	show = false,
	value = 0,
	renderTooltipContent = ( v ) => v,
	zIndex = 100,
} ) {
	const position = useTooltipPosition( { inputRef } );

	return (
		<Tooltip position={ position } show={ show } style={ { zIndex } }>
			{ renderTooltipContent( value ) }
		</Tooltip>
	);
}

function useTooltipPosition( { inputRef } ) {
	const [ position, setPosition ] = useState( 'top' );

	const calculatePosition = useCallback( () => {
		if ( inputRef.current ) {
			const { top } = inputRef.current.getBoundingClientRect();
			const isOverlay = top - TOOLTIP_OFFSET_HEIGHT < 0;
			const nextPosition = isOverlay ? 'bottom' : 'top';

			setPosition( nextPosition );
		}
	}, [] );

	useEffect( () => {
		calculatePosition();
	}, [ calculatePosition ] );

	useEffect( () => {
		window.addEventListener( 'resize', calculatePosition );

		return () => {
			window.removeEventListener( 'resize', calculatePosition );
		};
	} );

	return position;
}
