/**
 * WordPress dependencies
 */
import {
	ColorControl,
	BottomSheetConsumer,
	PanelBody,
} from '@wordpress/components';

export default function PanelColorGradientSettings( { settings, title } ) {
	return (
		<PanelBody title={ title }>
			<BottomSheetConsumer>
				{ ( { onReplaceSubsheet } ) =>
					settings.map(
						( {
							onColorChange,
							colorValue,
							onGradientChange,
							gradientValue,
							label,
						} ) => (
							<ColorControl
								onPress={ () => {
									onReplaceSubsheet( 'Color', {
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
					)
				}
			</BottomSheetConsumer>
		</PanelBody>
	);
}
