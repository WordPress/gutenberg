/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';
import { removeFormat } from '@wordpress/rich-text';
import { useSetting } from '@wordpress/block-editor';
import { BottomSheet, ColorSettings } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { textColor as settings } from './index';
import { getActiveColors, setColors } from './inline.js';

function ColorPicker( { name, value, onChange } ) {
	const property = 'color';
	const colors = useSetting( 'color.palette' ) || settings.colors;
	const colorSettings = {
		colors,
	};

	const onColorChange = useCallback(
		( color ) => {
			if ( color !== '' ) {
				onChange(
					setColors( value, name, colors, { [ property ]: color } )
				);
			} else {
				onChange( removeFormat( value, name ) );
			}
		},
		[ colors, onChange, property ]
	);
	const activeColors = useMemo(
		() => getActiveColors( value, name, colors ),
		[ name, value, colors ]
	);

	return (
		<ColorSettings
			colorValue={ activeColors[ property ] }
			onColorChange={ onColorChange }
			defaultSettings={ colorSettings }
			hideNavigation
		/>
	);
}

export default function InlineColorUI( { name, value, onChange, onClose } ) {
	return (
		<BottomSheet
			isVisible
			onClose={ onClose }
			hideHeader
			contentStyle={ { paddingLeft: 0, paddingRight: 0 } }
			hasNavigation
			leftButton={ null }
		>
			<BottomSheet.NavigationContainer animate main>
				<BottomSheet.NavigationScreen name="text-color">
					<ColorPicker
						name={ name }
						value={ value }
						onChange={ onChange }
					/>
				</BottomSheet.NavigationScreen>
			</BottomSheet.NavigationContainer>
		</BottomSheet>
	);
}
