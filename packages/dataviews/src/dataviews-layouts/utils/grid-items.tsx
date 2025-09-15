/**
 * External dependencies
 */
import type { ComponentPropsWithoutRef } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * External dependencies
 */
import clsx from 'clsx';

export const GridItems = forwardRef<
	HTMLDivElement,
	{
		className?: string;
		previewSize: number | undefined;
	} & ComponentPropsWithoutRef< 'div' >
>( ( { className, previewSize, ...props }, ref ) => {
	return (
		<div
			ref={ ref }
			className={ clsx( 'dataviews-view-grid-items', className ) }
			style={ {
				gridTemplateColumns:
					previewSize &&
					`repeat(auto-fill, minmax(${ previewSize }px, 1fr))`,
			} }
			{ ...props }
		/>
	);
} );
