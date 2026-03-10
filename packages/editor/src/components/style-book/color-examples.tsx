/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __experimentalGrid as Grid } from '@wordpress/components';
import {
	getColorClassName,
	__experimentalGetGradientClass,
	// @wordpress/block-editor imports are not typed.
	// @ts-expect-error
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import type { Color, Gradient, ColorExampleProps } from './types';

const ColorExamples = ( {
	colors,
	type,
	templateColumns = '1fr 1fr',
	itemHeight = '52px',
}: ColorExampleProps ) => {
	if ( ! colors ) {
		return null;
	}

	return (
		<Grid templateColumns={ templateColumns } rowGap={ 8 } columnGap={ 16 }>
			{ colors.map( ( color: Color | Gradient ) => {
				const className =
					type === 'gradients'
						? __experimentalGetGradientClass( color.slug )
						: getColorClassName( 'background-color', color.slug );
				const classes = clsx(
					'editor-style-book__color-example',
					className
				);

				return (
					<div
						key={ color.slug }
						className={ classes }
						style={ { height: itemHeight } }
					/>
				);
			} ) }
		</Grid>
	);
};

export default ColorExamples;
