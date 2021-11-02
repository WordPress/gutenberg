/**
 * WordPress dependencies
 */
import { __experimentalColorEdit as ColorEdit } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSetting } from './hooks';

/**
 * Shared reference to an empty array for cases where it is important to avoid
 * returning a new array reference on every invocation, as in a connected or
 * other pure component which performs `shouldComponentUpdate` check on props.
 * This should be used as a last resort, since the normalized data should be
 * maintained by the reducer result in state.
 *
 * @type {Array}
 */
const EMPTY_ARRAY = [];

export default function ColorPalettePanel( { name } ) {
	const [ colors, setColors ] = useSetting( 'color.palette', name );
	const [ userColors ] = useSetting( 'color.palette', name, 'user' );
	const [ baseGlobalPalette ] = useSetting(
		'color.palette',
		undefined,
		'base'
	);
	const [ baseContextualPalette ] = useSetting(
		'color.palette',
		name,
		'base'
	);
	const immutableColorSlugs = useMemo( () => {
		const basePalette = baseContextualPalette ?? baseGlobalPalette;
		if ( ! basePalette ) {
			return EMPTY_ARRAY;
		}
		return basePalette.map( ( { slug } ) => slug );
	}, [ baseContextualPalette, baseGlobalPalette ] );

	return (
		<div className="edit-site-global-styles-color-palette-panel">
			<ColorEdit
				immutableColorSlugs={ immutableColorSlugs }
				colors={ colors }
				onChange={ setColors }
				emptyUI={ __(
					'Colors are empty! Add some colors to create your own color palette.'
				) }
				canReset={ colors === userColors }
			/>
		</div>
	);
}
