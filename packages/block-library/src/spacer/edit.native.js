/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { useConvertUnitToMobile } from '@wordpress/components';
import { withPreferredColorScheme } from '@wordpress/compose';
import { InspectorControls } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Controls from './controls';
import styles from './editor.native.scss';

const Spacer = ( {
	attributes,
	context,
	setAttributes,
	isSelected,
	getStylesFromColorScheme,
} ) => {
	const { height, width } = attributes;

	const { orientation } = context;
	const defaultStyle = getStylesFromColorScheme(
		styles.staticSpacer,
		styles.staticDarkSpacer
	);

	useEffect( () => {
		if ( orientation === 'horizontal' && ! width ) {
			setAttributes( {
				height: '0px',
				width: '72px',
			} );
		}
	}, [] );

	const convertedHeight = useConvertUnitToMobile( height );
	const convertedWidth = useConvertUnitToMobile( width );

	return (
		<View
			style={ [
				defaultStyle,
				isSelected && styles.selectedSpacer,
				{ height: convertedHeight, width: convertedWidth },
			] }
		>
			{ isSelected && (
				<InspectorControls>
					<Controls
						attributes={ attributes }
						context={ context }
						setAttributes={ setAttributes }
					/>
				</InspectorControls>
			) }
		</View>
	);
};

export default withPreferredColorScheme( Spacer );
