/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Tooltip } from './styles/range-control-styles';

import type { TooltipProps } from './types';
import type { WordPressComponentProps } from '../context';

export default function SimpleTooltip(
	props: WordPressComponentProps< TooltipProps, 'span' >
) {
	const {
		className,
		inputRef,
		tooltipPosition,
		show = false,
		style = {},
		value = 0,
		renderTooltipContent = ( v ) => v,
		zIndex = 100,
		...restProps
	} = props;
	const position = useTooltipPosition( { inputRef, tooltipPosition } );
	const classes = clsx( 'components-simple-tooltip', className );
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

function useTooltipPosition( { inputRef, tooltipPosition }: TooltipProps ) {
	const [ position, setPosition ] = useState< string >();

	const setTooltipPosition = useCallback( () => {
		if ( inputRef && inputRef.current ) {
			setPosition( tooltipPosition );
		}
	}, [ tooltipPosition, inputRef ] );

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
