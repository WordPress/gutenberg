/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import { useContextSystem, WordPressComponentProps } from '../../ui/context';
import { useCx } from '../../utils/hooks';

import type { TooltipProps } from '../types';

function useTooltipPosition( { inputRef, tooltipPosition }: TooltipProps ) {
	const [ position, setPosition ] = useState< string >();

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

export function useTooltip(
	props: WordPressComponentProps< TooltipProps, 'span' >
) {
	const {
		className,
		inputRef,
		renderTooltipContent = ( v: number | '' | null ) => v,
		show = false,
		fillPercentage = 50,
		tooltipPosition = 'bottom',
		value = 0,
		zIndex = 100,
		...otherProps
	} = useContextSystem( props, 'Tooltip' );

	const position = useTooltipPosition( { inputRef, tooltipPosition } );

	// Generate dynamic class names.
	const cx = useCx();
	const classes = useMemo( () => {
		const tooltipProps = { fillPercentage, position, show, zIndex };
		return cx( styles.tooltip( tooltipProps ), className );
	}, [ className, cx, fillPercentage, position, show, zIndex ] );

	const content = renderTooltipContent( value );

	return {
		...otherProps,
		className: classes,
		content,
	};
}
