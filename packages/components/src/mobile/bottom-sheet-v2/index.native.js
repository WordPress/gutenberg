/**
 * External dependencies
 */
import BottomSheet, {
	BottomSheetBackdrop,
	BottomSheetScrollView,
	useBottomSheetDynamicSnapPoints,
} from '@gorhom/bottom-sheet';
import { Modal } from 'react-native';

/**
 * WordPress dependencies
 */
import {
	forwardRef,
	useCallback,
	useState,
	useImperativeHandle,
	useRef,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './style';

function BottomSheetV2WithRef(
	{ children, index = 0, onClose, snapPoints = [ '50%' ] } = {},
	ref
) {
	const bottomSheetRef = useRef( null );
	const [ visible, setVisible ] = useState( index >= 0 );
	/**
	 * `internalIndex` is used to allow displaying the modal on initial render,
	 * which is required in some areas of the code base that do not easily support
	 * an call to an imperative `present` method.
	 */
	const [ internalIndex, setInternalIndex ] = useState( index );

	const handlePresent = useCallback( () => {
		setVisible( true );
		setInternalIndex( index >= 0 ? index : 0 );
	}, [] );

	const handleDismiss = useCallback( () => {
		bottomSheetRef.current?.close();
	}, [] );

	/**
	 * Utilize imperative handle to mimic the `@gorhom/bottom-sheet` API, which
	 * would simplify migrating to `BottomSheetModal` in the future once the
	 * editor header navigation is rendered by React Native, not the native host
	 * app.
	 */
	useImperativeHandle( ref, () => ( {
		present: handlePresent,
		dismiss: handleDismiss,
	} ) );

	const renderBackdrop = useCallback(
		( props ) => (
			<BottomSheetBackdrop
				{ ...props }
				disappearsOnIndex={ -1 }
				appearsOnIndex={ 0 }
			/>
		),
		[]
	);

	const {
		animatedHandleHeight,
		animatedSnapPoints,
		animatedContentHeight,
		handleContentLayout,
	} = useBottomSheetDynamicSnapPoints( snapPoints );

	return (
		<Modal transparent={ true } visible={ visible }>
			<BottomSheet
				backdropComponent={ renderBackdrop }
				backgroundStyle={ styles[ 'bottom-sheet-v2__background' ] }
				enablePanDownToClose={ true }
				contentHeight={ animatedContentHeight }
				handleHeight={ animatedHandleHeight }
				handleIndicatorStyle={
					styles[ 'bottom-sheet-v2__handle-indicator' ]
				}
				index={ internalIndex }
				onClose={ () => {
					setVisible( false );
					if ( onClose ) {
						onClose();
					}
				} }
				ref={ bottomSheetRef }
				snapPoints={ animatedSnapPoints }
			>
				<BottomSheetScrollView onLayout={ handleContentLayout }>
					{ children }
				</BottomSheetScrollView>
			</BottomSheet>
		</Modal>
	);
}

const BottomSheetV2 = forwardRef( BottomSheetV2WithRef );

BottomSheetV2.CONTENT_HEIGHT = 'CONTENT_HEIGHT';

export default BottomSheetV2;
