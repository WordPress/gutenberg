// @ts-nocheck
/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Tooltip } from './styles/range-control-styles';

export default function SimpleTooltip( {
	className,
	inputRef,
	tooltipPosition,
	show = false,
	style = {},
	value = 0,
	renderTooltipContent = ( v ) => v,
	zIndex = 100,
	...restProps
} ) {
	const position = useTooltipPosition( { inputRef, tooltipPosition } );
	const classes = classnames( 'components-simple-tooltip', className );
	const styles = {
		...style,
		zIndex,
	};

	return (
		<Tooltip
			{ ...restProps }
			aria-hidden={ show }
			className={ classes }
			position={ position }
			show={ show }
			role="tooltip"
			style={ styles }
		>
			{ renderTooltipContent( value ) }
		</Tooltip>
	);
}

function useTooltipPosition( { inputRef, tooltipPosition } ) {
	const [ position, setPosition ] = useState();

	const setTooltipPosition = useCallback( () => {
		if ( inputRef && inputRef.current ) {
			setPosition( tooltipPosition );
		}
	}, [ tooltipPosition ] );

	useEffect( () => {
		setTooltipPosition();
	}, [ setTooltipPosition ] );

	useEffect( () => {
		window.addEventListener( 'resize', setTooltipPosition );

		return () => {
			window.removeEventListener( 'resize', setTooltipPosition );
		};
	} );

	return position;
}
