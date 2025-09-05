/**
 * WordPress dependencies
 */
import { __experimentalGrid as Grid } from '@wordpress/components';
import { View } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import type { Duotone } from './types';

const DuotoneExamples = ( {
	duotones,
}: {
	duotones: Duotone[];
} ): JSX.Element | null => {
	if ( ! duotones ) {
		return null;
	}

	return (
		<Grid columns={ 2 } rowGap={ 16 } columnGap={ 16 }>
			{ duotones.map( ( duotone: Duotone ) => {
				return (
					<Grid
						key={ duotone.slug }
						className="edit-site-style-book__duotone-example"
						columns={ 2 }
						rowGap={ 8 }
						columnGap={ 8 }
					>
						<View>
							<img
								alt={ `Duotone example: ${ duotone.slug }` }
								src="https://s.w.org/images/core/5.3/MtBlanc1.jpg"
								style={ {
									filter: `url(#wp-duotone-${ duotone.slug })`,
								} }
							/>
						</View>
						{ duotone.colors.map( ( color ) => {
							return (
								<View
									key={ color }
									className="edit-site-style-book__color-example"
									style={ { backgroundColor: color } }
								/>
							);
						} ) }
					</Grid>
				);
			} ) }
		</Grid>
	);
};

export default DuotoneExamples;
