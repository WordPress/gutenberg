/**
 * WordPress dependencies
 */
import { ColorControl, PanelBody } from '@wordpress/components';
/**
 * External dependencies
 */
import { useNavigation } from '@react-navigation/native';

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
							navigation.navigate( 'Colors', {
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
