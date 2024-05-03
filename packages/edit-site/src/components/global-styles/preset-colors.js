/**
 * WordPress dependencies
 */
import { __unstableMotion as motion } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useStylesPreviewColors } from './hooks';

export default function PresetColors() {
	const { paletteColors } = useStylesPreviewColors();
	return paletteColors.slice( 0, 5 ).map( ( { slug, color }, index ) => (
		<motion.div
			key={ `${ slug }-${ index }` }
			style={ {
				flexGrow: 1,
				height: '100%',
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
