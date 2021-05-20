/**
 * External dependencies
 */
import { ActionSheetIOS } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, forwardRef, useContext } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { BottomSheetContext } from '@wordpress/components';

class Picker extends Component {
	presentPicker() {
		const {
			options,
			onChange,
			title,
			destructiveButtonIndex,
			disabledButtonIndices,
			getAnchor,
			isBottomSheetOpened,
			closeBottomSheet,
			onHandleClosingBottomSheet,
		} = this.props;
		const labels = options.map( ( { label } ) => label );
		const fullOptions = [ __( 'Cancel' ) ].concat( labels );

		ActionSheetIOS.showActionSheetWithOptions(
			{
				title,
				options: fullOptions,
				cancelButtonIndex: 0,
				destructiveButtonIndex,
				disabledButtonIndices,
				anchor: getAnchor && getAnchor(),
			},
			( buttonIndex ) => {
				if ( buttonIndex === 0 ) {
					return;
				}
				const selected = options[ buttonIndex - 1 ];

				if ( selected.requiresModal && isBottomSheetOpened ) {
					onHandleClosingBottomSheet( () => {
						onChange( selected.value );
					} );
					closeBottomSheet();
				} else {
					onChange( selected.value );
				}
			}
		);
	}

	render() {
		return null;
	}
}

const PickerComponent = forwardRef( ( props, ref ) => {
	const isBottomSheetOpened = useSelect( ( select ) =>
		select( 'core/edit-post' ).isEditorSidebarOpened()
	);
	const { closeGeneralSidebar } = useDispatch( 'core/edit-post' );
	const { onHandleClosingBottomSheet } = useContext( BottomSheetContext );

	return (
		<Picker
			ref={ ref }
			{ ...props }
			isBottomSheetOpened={ isBottomSheetOpened }
			closeBottomSheet={ closeGeneralSidebar }
			onHandleClosingBottomSheet={ onHandleClosingBottomSheet }
		/>
	);
} );

export default PickerComponent;
