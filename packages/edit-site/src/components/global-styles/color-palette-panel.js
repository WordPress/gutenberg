/**
 * WordPress dependencies
 */
import { __experimentalColorEdit as ColorEdit } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useSetting } from './hooks';

export default function ColorPalettePanel( { name } ) {
	const [ userColors, setColors ] = useSetting(
		'color.palette',
		name,
		'user'
	);
	return (
		<div className="edit-site-global-styles-color-palette-panel">
			<ColorEdit colors={ userColors } onChange={ setColors } />
		</div>
	);
}
