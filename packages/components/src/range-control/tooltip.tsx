import clsx from 'clsx';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { PolymorphicElement } from '../utils/polymorphic-element';
import moduleStyles from './style.module.scss';
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
	const classes = clsx(
		'components-simple-tooltip',
		moduleStyles.tooltip,
		className,
		{
			[ moduleStyles[ 'is-visible' ] ]: show,
			[ moduleStyles[ 'is-bottom' ] ]: placement === 'bottom',
		}
	);
	const styles = {
		...style,
		zIndex,
	};

	return (
		<PolymorphicElement
			as="span"
			{ ...restProps }
			aria-hidden="false"
			className={ classes }
			role="tooltip"
			style={ styles }
		>
			{ renderTooltipContent( value ) }
		</PolymorphicElement>
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
