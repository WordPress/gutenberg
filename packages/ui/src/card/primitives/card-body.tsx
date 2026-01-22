import { mergeProps, useRender } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { CardSectionProps } from '../types';
import styles from '../style.module.css';
import resetStyles from '../../utils/css/resets.module.css';

/**
 * Default render function that renders a div element with the given props.
 */
const DEFAULT_RENDER = ( props: React.ComponentPropsWithoutRef< 'div' > ) => (
	<div { ...props } />
);

export const CardBody = forwardRef< HTMLDivElement, CardSectionProps >(
	function CardBody( { className, render = DEFAULT_RENDER, ...props }, ref ) {
		const element = useRender( {
			render,
			ref,
			props: mergeProps< 'div' >( props, {
				className: clsx(
					resetStyles[ 'box-sizing' ],
					styles.body,
					className
				),
			} ),
		} );

		return element;
	}
);
