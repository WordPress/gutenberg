/**
 * External dependencies
 */
import BottomSheetExternal, {
	BottomSheetBackdrop,
	BottomSheetScrollView,
	useBottomSheetDynamicSnapPoints,
} from '@gorhom/bottom-sheet';
import { Modal } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';

function BottomSheetWithRef(
	{ children, index, onClose, snapPoints = [ '50%' ] } = {},
	ref
) {
	const backgroundStyle = [
		styles[ 'bottom-sheet-v2__background' ],
		usePreferredColorSchemeStyle(
			null,
			styles[ 'bottom-sheet-v2__background--dark' ]
		),
	];

	const renderBackdrop = useCallback(
		( props ) => (
			<BottomSheetBackdrop
				{ ...props }
				opacity={ 0.2 }
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
		<BottomSheetExternal
			backdropComponent={ renderBackdrop }
			backgroundStyle={ backgroundStyle }
			enablePanDownToClose={ true }
			contentHeight={ animatedContentHeight }
			handleHeight={ animatedHandleHeight }
			handleIndicatorStyle={
				styles[ 'bottom-sheet-v2__handle-indicator' ]
			}
			index={ index }
			onClose={ onClose }
			ref={ ref }
			snapPoints={ animatedSnapPoints }
		>
			<BottomSheetScrollView onLayout={ handleContentLayout }>
				{ children }
			</BottomSheetScrollView>
		</BottomSheetExternal>
	);
}

const BottomSheet = forwardRef( BottomSheetWithRef );

const BottomSheetModalWithRef = (
	{ index = 0, onClose, ...bottomSheetProps },
	ref
) => {
	const bottomSheetRef = useRef( null );

	/**
	 * `internalIndex` is used to allow displaying the modal on initial render,
	 * which is required in some areas of the code base that do not easily support
	 * a call to an imperative `present` method.
	 */
	const [ internalIndex, setInternalIndex ] = useState( index );
	const [ visible, setVisible ] = useState( index >= 0 );

	const handlePresent = useCallback( () => {
		setVisible( true );
		setInternalIndex( index >= 0 ? index : 0 );
	}, [ index ] );

	const handleDismiss = useCallback( () => {
		bottomSheetRef.current?.close();
	}, [] );

	/**
	 * Utilize imperative handle to mimic the `@gorhom/bottom-sheet` API, which
	 * would simplify migrating to `BottomSheetModal` in the future if the editor
	 * header navigation is rendered by React Native, not the native host app.
	 */
	useImperativeHandle(
		ref,
		() => ( {
			present: handlePresent,
			dismiss: handleDismiss,
		} ),
		[ handleDismiss, handlePresent ]
	);

	const handleClose = useCallback( () => {
		setVisible( false );
		if ( onClose ) {
			onClose();
		}
	}, [ onClose ] );

	return (
		<Modal
			onRequestClose={ handleDismiss }
			transparent={ true }
			visible={ visible }
		>
			<GestureHandlerRootView
				style={ styles[ 'bottom-sheet-v2__gesture-handler' ] }
			>
				<BottomSheet
					{ ...bottomSheetProps }
					index={ internalIndex }
					ref={ bottomSheetRef }
					onClose={ handleClose }
				/>
			</GestureHandlerRootView>
		</Modal>
	);
};

const BottomSheetModal = forwardRef( BottomSheetModalWithRef );

BottomSheetModal.CONTENT_HEIGHT = 'CONTENT_HEIGHT';

export default BottomSheetModal;
