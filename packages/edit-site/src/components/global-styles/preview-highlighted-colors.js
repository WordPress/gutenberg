/**
 * WordPress dependencies
 */
import { __unstableMotion as motion } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useStylesPreviewColors } from './hooks';

export default function PreviewHighlightedColors( {
	normalizedColorSwatchSize,
	ratio,
} ) {
	const { highlightedColors } = useStylesPreviewColors();
	return highlightedColors.map( ( { slug, color }, index ) => (
		<motion.div
			key={ slug }
			style={ {
				height: normalizedColorSwatchSize * ratio,
				width: normalizedColorSwatchSize * ratio,
				background: color,
				borderRadius: ( normalizedColorSwatchSize * ratio ) / 2,
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
