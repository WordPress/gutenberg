/**
 * External dependencies
 */
import { useNavigation } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { ColorControl, PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { blockSettingsScreens } from '../block-settings';

export default function PanelColorGradientSettings( { settings, title } ) {
	const navigation = useNavigation();

	return (
		<PanelBody title={ title }>
			{ settings.map(
				( {
					onColorChange,
					colorValue,
					onGradientChange,
					gradientValue,
					label,
				} ) => (
					<ColorControl
						onPress={ () => {
							navigation.navigate( blockSettingsScreens.color, {
								onColorChange,
								colorValue: gradientValue || colorValue,
								gradientValue,
								onGradientChange,
								label,
							} );
						} }
						key={ `color-setting-${ label }` }
						label={ label }
						color={ gradientValue || colorValue }
					/>
				)
			) }
		</PanelBody>
	);
}
