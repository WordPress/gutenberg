/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BottomSheet from '../bottom-sheet';

const Picker = ( {
	hideCancelButton,
	isOpen,
	onChange,
	onClose,
	options,
} ) => (
	<BottomSheet
		isVisible={ isOpen }
		onClose={ onClose }
		style={ { paddingBottom: 20 } }
		hideHeader
	>
		<View>
			{ options.map( ( option, index ) =>
				<BottomSheet.Cell
					icon={ option.icon }
					key={ index }
					label={ option.label }
					separatorType={ 'none' }
					onPress={ () => onChange( option.value ) }
				/>
			) }
			{ ! hideCancelButton && <BottomSheet.Cell
				label={ __( 'Cancel' ) }
				onPress={ onClose }
				separatorType={ 'none' }
			/> }
		</View>
	</BottomSheet>
);

export default Picker;
