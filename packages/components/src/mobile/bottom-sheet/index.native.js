/**
 * External dependencies
 */
import {
	Dimensions,
	Keyboard,
	LayoutAnimation,
	PanResponder,
	Platform,
	ScrollView,
	StatusBar,
	Text,
	TouchableHighlight,
	View,
} from 'react-native';
import Modal from 'react-native-modal';
import SafeArea from 'react-native-safe-area';
import { omit } from 'lodash';
import {
	BottomSheetModal,
	BottomSheetBackdrop,
	BottomSheetScrollView,
	useBottomSheetDynamicSnapPoints,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeViewGestureHandler } from 'react-native-gesture-handler';

/**
 * WordPress dependencies
 */
import { subscribeAndroidModalClosed } from '@wordpress/react-native-bridge';
import {
	Component,
	useRef,
	useMemo,
	useCallback,
	useState,
	useEffect,
} from '@wordpress/element';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import Button from './button';
import Cell from './cell';
import CyclePickerCell from './cycle-picker-cell';
import PickerCell from './picker-cell';
import SwitchCell from './switch-cell';
import RangeCell from './range-cell';
import ColorCell from './color-cell';
import LinkCell from './link-cell';
import LinkSuggestionItemCell from './link-suggestion-item-cell';
import RadioCell from './radio-cell';
import NavigationScreen from './bottom-sheet-navigation/navigation-screen';
import NavigationContainer from './bottom-sheet-navigation/navigation-container';
import KeyboardAvoidingView from './keyboard-avoiding-view';
import BottomSheetSubSheet from './sub-sheet';
import NavBar from './nav-bar';
import { BottomSheetProvider } from './bottom-sheet-context';

const DEFAULT_LAYOUT_ANIMATION = LayoutAnimation.Presets.easeInEaseOut;

function BottomSheetComponent( props ) {
	const {
		title = '',
		isVisible,
		leftButton,
		rightButton,
		header,
		hideHeader,
		style = {},
		inserter,
		contentStyle = {},
		children,
		withHeaderSeparator = false,
		hasNavigation,
		isFullScreen: currentIsFullScreen,
		setMinHeightToMaxHeight,
		allowDragIndicator,
		onDismiss: currentOnDismiss,
		onClose: currentOnClose,
	} = props;
	const bottomSheetRef = useRef( null );
	// const snapPoints = useMemo( () => {
	// 	return [ '50%', '100%' ];
	// 	// return currentIsFullScreen ? [ '50%', '100%' ] : [ '50%' ];
	// }, [] );
	const initialSnapPoints = useMemo( () => {
		return currentIsFullScreen
			? [ 'CONTENT_HEIGHT' ]
			: [ 'CONTENT_HEIGHT' ];
	}, [] );
	const insets = useSafeAreaInsets();

	const {
		animatedHandleHeight,
		animatedSnapPoints,
		animatedContentHeight,
		handleContentLayout,
	} = useBottomSheetDynamicSnapPoints( initialSnapPoints );

	const [ bounces, setBounces ] = useState( false );
	const [ maxHeight, setMaxHeight ] = useState( 0 );
	const [ scrollEnabled, setScrollEnabled ] = useState( true );
	const [ isScrolling, setIsScrolling ] = useState( false );
	const [ handleClosingBottomSheet, setHandleClosingBottomSheet ] = useState(
		null
	);
	const [
		handleHardwareButtonPress,
		setHandleHardwareButtonPress,
	] = useState( null );
	const [ isMaxHeightSet, setIsMaxHeightSet ] = useState( true );
	const [ isFullScreen, setIsFullScreen ] = useState(
		currentIsFullScreen || false
	);

	useEffect( () => {
		if ( isVisible ) {
			bottomSheetRef.current?.present();
		} else {
			// bottomSheetRef.current?.dismiss();
		}
	}, [ isVisible ] );

	// callbacks
	const handlePresentModalPress = useCallback( () => {
		bottomSheetRef.current?.present();
	}, [] );
	const handleSheetChanges = useCallback( ( index ) => {
		// console.log( 'handleSheetChanges', index );
	}, [] );

	const onHandleClosingBottomSheet = useCallback( ( action ) => {
		// setHandleClosingBottomSheet( action );
	}, [] );

	const onHandleHardwareButtonPress = useCallback( ( action ) => {
		// setHandleHardwareButtonPress( action );
	}, [] );

	const onShouldSetBottomSheetMaxHeight = useCallback( ( value ) => {
		// console.log( 'onShouldSetBottomSheetMaxHeight value', value );
		// setIsMaxHeightSet( value );
	}, [] );

	const onShouldEnableScroll = useCallback( ( value ) => {
		// setScrollEnabled( value );
	}, [] );

	const onCloseBottomSheet = useCallback( () => {
		if ( handleClosingBottomSheet ) {
			handleClosingBottomSheet();
			onHandleClosingBottomSheet( null );
		}
		if ( currentOnClose ) {
			currentOnClose();
		}
		// onShouldSetBottomSheetMaxHeight( true );
	}, [ handleClosingBottomSheet ] );

	const onDismiss = useCallback( () => {
		if ( currentOnDismiss ) {
			currentOnDismiss();
		}

		onCloseBottomSheet();
	}, [ currentOnDismiss ] );

	const onSetIsFullScreen = useCallback( ( newIsFullScreen ) => {
		// if ( newIsFullScreen !== isFullScreen ) {
		// 	if ( newIsFullScreen ) {
		// 		setIsFullScreen( newIsFullScreen );
		// 		setIsMaxHeightSet( false );
		// 	} else {
		// 		setIsFullScreen( newIsFullScreen );
		// 		setIsMaxHeightSet( true );
		// 	}
		// }
	}, [] );

	const backgroundStyle = usePreferredColorSchemeStyle(
		styles.background,
		styles.backgroundDark
	);

	const bottomSheetHeaderTitleStyle = usePreferredColorSchemeStyle(
		styles.bottomSheetHeaderTitle,
		styles.bottomSheetHeaderTitleDark
	);

	const WrapperView = hasNavigation ? View : BottomSheetScrollView;

	const getHeader = () => (
		<>
			{ header || (
				<View style={ styles.bottomSheetHeader }>
					<View style={ styles.flex }>{ leftButton }</View>
					<Text
						style={ bottomSheetHeaderTitleStyle }
						maxFontSizeMultiplier={ 3 }
					>
						{ title }
					</Text>
					<View style={ styles.flex }>{ rightButton }</View>
				</View>
			) }
			{ withHeaderSeparator && <View style={ styles.separator } /> }
		</>
	);

	const listStyle = {};
	// if ( isFullScreen ) {
	// 	listStyle = { flexGrow: 1, flexShrink: 1 };
	// } else if ( isMaxHeightSet ) {
	// 	listStyle = { maxHeight };

	// 	// Allow setting a "static" height of the bottom sheet
	// 	// by settting the min height to the max height.
	// 	if ( setMinHeightToMaxHeight ) {
	// 		listStyle.minHeight = maxHeight;
	// 	}
	// }

	const listProps = {
		disableScrollViewPanResponder: true,
		bounces,
		onScroll: () => null,
		onScrollBeginDrag: () => null,
		onScrollEndDrag: () => null,
		scrollEventThrottle: 16,
		contentContainerStyle: [
			( ! hasNavigation || inserter ) && styles.content,
			hideHeader && styles.emptyHeader,
			contentStyle,
			isFullScreen && { flexGrow: 1 },
		],
		style: listStyle,
		safeAreaBottomInset: insets.bottom,
		scrollEnabled,
		automaticallyAdjustContentInsets: false,
	};

	const renderBackdrop = useCallback(
		( backdropProps ) => (
			<BottomSheetBackdrop
				disappearsOnIndex={ -1 }
				appearsOnIndex={ 0 }
				{ ...backdropProps }
			/>
		),
		[]
	);

	const BottomSheetBackground = useCallback(
		( { style: defautlStyle } ) => {
			return <View style={ [ { ...defautlStyle }, backgroundStyle ] } />;
		},
		[ backgroundStyle ]
	);

	const renderHandle = useCallback( () => {
		let canShowDragIndicator = false;
		// if iOS or not fullscreen show the drag indicator
		if ( Platform.OS === 'ios' || ! isFullScreen ) {
			canShowDragIndicator = true;
		}

		if ( allowDragIndicator ) {
			canShowDragIndicator = true;
		}

		return (
			canShowDragIndicator && (
				<View style={ backgroundStyle }>
					<View style={ styles.dragIndicator } />
				</View>
			)
		);
	}, [ backgroundStyle ] );

	return (
		<BottomSheetModal
			ref={ bottomSheetRef }
			// snapPoints={ snapPoints }
			snapPoints={ animatedSnapPoints }
			handleHeight={ animatedHandleHeight }
			contentHeight={ animatedContentHeight }
			// onChange={ handleSheetChanges }
			// onDismiss={ Platform.OS === 'ios' ? onDismiss : undefined }
			onDismiss={ onDismiss }
			backdropComponent={ renderBackdrop }
			backgroundComponent={ BottomSheetBackground }
			handleComponent={ renderHandle }
			// bottomInset={ insets.bottom }
			keyboardBlurBehavior="restore"
		>
			<NativeViewGestureHandler disallowInterruption={ true }>
				<View
					style={ [
						{
							...backgroundStyle,
							// maxHeight: '60%',
							// paddingBottom: insets.bottom,
							// alignSelf: 'center',
						},
						hasNavigation && { style: listProps.style },
					] }
					onLayout={ handleContentLayout }
					// style={ {
					// 	...backgroundStyle,
					// 	borderColor: 'rgba(0, 0, 0, 0.1)',
					// 	marginTop:
					// 		Platform.OS === 'ios' && isFullScreen
					// 			? safeAreaTopInset
					// 			: 0,
					// 	flex: isFullScreen ? 1 : undefined,
					// 	...( Platform.OS === 'android' && isFullScreen
					// 		? styles.backgroundFullScreen
					// 		: {} ),
					// 	...style,
					// } }
				>
					<View
						style={ styles.header }
						onLayout={ this.onHeaderLayout }
					>
						{ ! hideHeader && getHeader() }
					</View>

					<BottomSheetProvider
						value={ {
							shouldEnableBottomSheetScroll: onShouldEnableScroll,
							shouldEnableBottomSheetMaxHeight: onShouldSetBottomSheetMaxHeight,
							isBottomSheetContentScrolling: isScrolling,
							onHandleClosingBottomSheet,
							onHandleHardwareButtonPress,
							listProps,
							setIsFullScreen: onSetIsFullScreen,
							safeAreaBottomInset: insets.bottom,
						} }
					>
						{ hasNavigation ? (
							<>{ children }</>
						) : (
							<TouchableHighlight accessible={ false }>
								<>{ children }</>
							</TouchableHighlight>
						) }
					</BottomSheetProvider>
					{ ! hasNavigation && (
						<View
							style={ {
								height:
									insets.bottom ||
									styles.scrollableContent.paddingBottom,
							} }
						/>
					) }
				</View>
			</NativeViewGestureHandler>
		</BottomSheetModal>
	);
}

function getWidth() {
	return Math.min(
		Dimensions.get( 'window' ).width,
		styles.background.maxWidth
	);
}

BottomSheetComponent.getWidth = getWidth;
BottomSheetComponent.Button = Button;
BottomSheetComponent.Cell = Cell;
BottomSheetComponent.SubSheet = BottomSheetSubSheet;
BottomSheetComponent.NavBar = NavBar;
BottomSheetComponent.CyclePickerCell = CyclePickerCell;
BottomSheetComponent.PickerCell = PickerCell;
BottomSheetComponent.SwitchCell = SwitchCell;
BottomSheetComponent.RangeCell = RangeCell;
BottomSheetComponent.ColorCell = ColorCell;
BottomSheetComponent.LinkCell = LinkCell;
BottomSheetComponent.LinkSuggestionItemCell = LinkSuggestionItemCell;
BottomSheetComponent.RadioCell = RadioCell;
BottomSheetComponent.NavigationScreen = NavigationScreen;
BottomSheetComponent.NavigationContainer = NavigationContainer;

export default BottomSheetComponent;
