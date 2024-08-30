/**
 * Internal dependencies
 */
import { useStylesPreviewColors } from './hooks';

export default function PresetColors() {
	const { paletteColors } = useStylesPreviewColors();
	return paletteColors.slice( 0, 4 ).map( ( { slug, color }, index ) => (
		<div
			key={ `${ slug }-${ index }` }
			style={ {
				flexGrow: 1,
				height: '100%',
				background: color,
			} }
		/>
	) );
}
