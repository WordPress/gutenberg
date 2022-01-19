/**
 * External dependencies
 */
import { useNavigation } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { ColorControl, PanelBody } from '@wordpress/components';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { blockSettingsScreens } from '../block-settings';

export default function PanelColorGradientSettings( {
	settings,
	title,
	children,
} ) {
	const navigation = useNavigation();

	const mappedSettings = useMemo( () => {
		return settings.map(
			( {
				onColorChange,
				onColorCleared,
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
							onColorCleared,
							label,
						} );
					} }
					key={ `color-setting-${ label }` }
					label={ label }
					color={ gradientValue || colorValue }
				/>
			)
		);
	}, [ settings ] );

	return (
		<>
			<PanelBody title={ title }>{ mappedSettings }</PanelBody>
			<PanelBody>{ children }</PanelBody>
		</>
	);
}
