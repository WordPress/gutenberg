/**
 * WordPress dependencies
 */
import { __unstableMotion as motion } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useStylesPreviewColors } from './hooks';

export default function HighlightedColors( {
	normalizedColorSwatchSize,
	ratio,
} ) {
	const { paletteColors } = useStylesPreviewColors();
	const scaledSwatchSize = normalizedColorSwatchSize * ratio;
	return paletteColors.slice( 0, 5 ).map( ( { slug, color }, index ) => (
		<motion.div
			key={ `${ slug }-${ index }` }
			style={ {
				flexGrow: 1,
				height: scaledSwatchSize,
				background: color,
			} }
			animate={ {
				scale: 1,
				opacity: 1,
			} }
			initial={ {
				scale: 0.1,
				opacity: 0,
			} }
			transition={ {
				delay: index === 1 ? 0.2 : 0.1,
			} }
		/>
	) );
}
