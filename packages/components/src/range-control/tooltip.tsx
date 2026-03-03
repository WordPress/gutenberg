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
		tooltipPlacement,
		show = false,
		style = {},
		value = 0,
		renderTooltipContent = ( v ) => v,
		zIndex = 100,
		...restProps
	} = props;
	const placement = useTooltipPlacement( { inputRef, tooltipPlacement } );
	const classes = clsx( 'components-simple-tooltip', className );
	const styles = {
		...style,
		zIndex,
	};

	return (
		<Tooltip
			{ ...restProps }
			aria-hidden="false"
			className={ classes }
			placement={ placement }
			show={ show }
			role="tooltip"
			style={ styles }
		>
			{ renderTooltipContent( value ) }
		</Tooltip>
	);
}

function useTooltipPlacement( { inputRef, tooltipPlacement }: TooltipProps ) {
	const [ placement, setPlacement ] = useState< string >();

	const setTooltipPlacement = useCallback( () => {
		if ( inputRef && inputRef.current ) {
			setPlacement( tooltipPlacement );
		}
	}, [ tooltipPlacement, inputRef ] );

	useEffect( () => {
		setTooltipPlacement();
	}, [ setTooltipPlacement ] );

	useEffect( () => {
		window.addEventListener( 'resize', setTooltipPlacement );

		return () => {
			window.removeEventListener( 'resize', setTooltipPlacement );
		};
	} );

	return placement;
}
