import { mergeProps, useRender } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import styles from '../style.module.css';
import resetStyles from '../../utils/css/resets.module.css';
import type { CardSectionProps } from '../types';

const DEFAULT_RENDER = ( props: React.ComponentPropsWithoutRef< 'div' > ) => (
	<div { ...props } />
);

export const CardSummary = forwardRef< HTMLDivElement, CardSectionProps >(
	function CardSummary(
		{ className, render = DEFAULT_RENDER, ...props },
		ref
	) {
		const element = useRender( {
			render,
			ref,
			props: mergeProps< 'div' >( props, {
				className: clsx(
					resetStyles[ 'box-sizing' ],
					styles.summary,
					className
				),
			} ),
		} );

		return element;
	}
);
