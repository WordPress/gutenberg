/**
 * External dependencies
 */
import { View } from 'react-native';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { BottomSheet } from '@wordpress/components';

export default ( { applyImageOptions, cancelImageOptions } ) => (
	<View>
		<BottomSheet.Cell
			label={ __( 'Apply to all images' ) }
			onPress={ applyImageOptions }
		/>
		<BottomSheet.Cell
			label={ __( 'Cancel' ) }
			separatorType={ 'none' }
			onPress={ cancelImageOptions }
		/>
	</View>
);
