/**
 * External dependencies
 */
import {
	Text,
	View,
	Platform,
	PanResponder,
	Dimensions,
	ScrollView,
	Keyboard,
	StatusBar,
	TouchableHighlight,
} from 'react-native';
import Modal from 'react-native-modal';
import SafeArea from 'react-native-safe-area';

/**
 * WordPress dependencies
 */
import { subscribeAndroidModalClosed } from '@wordpress/react-native-bridge';
import { Component } from '@wordpress/element';
import { withPreferredColorScheme } from '@wordpress/compose';

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
import RadioCell from './radio-cell';
import KeyboardAvoidingView from './keyboard-avoiding-view';
import { BottomSheetProvider } from './bottom-sheet-context';
import { performLayoutAnimation } from '../layout-animation';

class BottomSheet extends Component {
	constructor() {
		super( ...arguments );
		this.onSafeAreaInsetsUpdate = this.onSafeAreaInsetsUpdate.bind( this );
		this.onScroll = this.onScroll.bind( this );
		this.isScrolling = this.isScrolling.bind( this );
		this.onShouldEnableScroll = this.onShouldEnableScroll.bind( this );
		this.onShouldSetBottomSheetMaxHeight = this.onShouldSetBottomSheetMaxHeight.bind(
			this
		);
		this.onDimensionsChange = this.onDimensionsChange.bind( this );
		this.onCloseBottomSheet = this.onCloseBottomSheet.bind( this );
		this.onHandleClosingBottomSheet = this.onHandleClosingBottomSheet.bind(
			this
		);
		this.onHardwareButtonPress = this.onHardwareButtonPress.bind( this );
		this.onHandleHardwareButtonPress = this.onHandleHardwareButtonPress.bind(
			this
		);
		this.onReplaceSubsheet = this.onReplaceSubsheet.bind( this );
		this.keyboardWillShow = this.keyboardWillShow.bind( this );
		this.keyboardDidHide = this.keyboardDidHide.bind( this );

		this.state = {
			safeAreaBottomInset: 0,
			bounces: false,
			maxHeight: 0,
			keyboardHeight: 0,
			scrollEnabled: true,
			isScrolling: false,
			onCloseBottomSheet: null,
			onHardwareButtonPress: null,
			isMaxHeightSet: true,
			currentScreen: '',
			extraProps: {},
		};

		SafeArea.getSafeAreaInsetsForRootView().then(
			this.onSafeAreaInsetsUpdate
		);
		Dimensions.addEventListener( 'change', this.onDimensionsChange );
	}

	keyboardWillShow( e ) {
		const { height } = e.endCoordinates;

		this.setState( { keyboardHeight: height }, () =>
			this.onSetMaxHeight()
		);
	}

	keyboardDidHide() {
		this.setState( { keyboardHeight: 0 }, () => this.onSetMaxHeight() );
	}

	componentDidMount() {
		if ( Platform.OS === 'android' ) {
			this.androidModalClosedSubscription = subscribeAndroidModalClosed(
				() => {
					this.props.onClose();
				}
			);
		}

		this.keyboardWillShowListener = Keyboard.addListener(
			'keyboardWillShow',
			this.keyboardWillShow
		);

		this.keyboardDidHideListener = Keyboard.addListener(
			'keyboardDidHide',
			this.keyboardDidHide
		);

		this.safeAreaEventSubscription = SafeArea.addEventListener(
			'safeAreaInsetsForRootViewDidChange',
			this.onSafeAreaInsetsUpdate
		);
		this.onSetMaxHeight();
	}

	componentWillUnmount() {
		if ( this.androidModalClosedSubscription ) {
			this.androidModalClosedSubscription.remove();
		}
		if ( this.safeAreaEventSubscription === null ) {
			return;
		}
		this.safeAreaEventSubscription.remove();
		this.safeAreaEventSubscription = null;
		SafeArea.removeEventListener(
			'safeAreaInsetsForRootViewDidChange',
			this.onSafeAreaInsetsUpdate
		);
		this.keyboardWillShowListener.remove();
		this.keyboardDidHideListener.remove();
	}

	componentDidUpdate( prevProps ) {
		const { isVisible } = this.props;

		if ( ! prevProps.isVisible && isVisible ) {
			this.setState( { currentScreen: '' } );
		}
	}

	onSafeAreaInsetsUpdate( result ) {
		const { safeAreaBottomInset } = this.state;
		if ( this.safeAreaEventSubscription === null ) {
			return;
		}
		const { safeAreaInsets } = result;
		if ( safeAreaBottomInset !== safeAreaInsets.bottom ) {
			this.setState( { safeAreaBottomInset: safeAreaInsets.bottom } );
		}
	}

	onSetMaxHeight() {
		const { height, width } = Dimensions.get( 'window' );
		const { safeAreaBottomInset, keyboardHeight } = this.state;
		const statusBarHeight =
			Platform.OS === 'android' ? StatusBar.currentHeight : 0;

		// `maxHeight` when modal is opened along with a keyboard
		const maxHeightWithOpenKeyboard =
			0.95 *
			( Dimensions.get( 'window' ).height -
				keyboardHeight -
				statusBarHeight );

		// On horizontal mode `maxHeight` has to be set on 90% of width
		if ( width > height ) {
			this.setState( {
				maxHeight: Math.min( 0.9 * height, maxHeightWithOpenKeyboard ),
			} );
			//	On vertical mode `maxHeight` has to be set on 50% of width
		} else {
			this.setState( {
				maxHeight: Math.min(
					height / 2 - safeAreaBottomInset,
					maxHeightWithOpenKeyboard
				),
			} );
		}
	}

	onDimensionsChange() {
		this.onSetMaxHeight();
		this.setState( { bounces: false } );
	}

	isCloseToBottom( { layoutMeasurement, contentOffset, contentSize } ) {
		return (
			layoutMeasurement.height + contentOffset.y >=
			contentSize.height - contentOffset.y
		);
	}

	isCloseToTop( { contentOffset } ) {
		return contentOffset.y < 10;
	}

	onScroll( { nativeEvent } ) {
		if ( this.isCloseToTop( nativeEvent ) ) {
			this.setState( { bounces: false } );
		} else if ( this.isCloseToBottom( nativeEvent ) ) {
			this.setState( { bounces: true } );
		}
	}

	onShouldEnableScroll( value ) {
		this.setState( { scrollEnabled: value } );
	}

	onShouldSetBottomSheetMaxHeight( value ) {
		this.setState( { isMaxHeightSet: value } );
	}

	isScrolling( value ) {
		this.setState( { isScrolling: value } );
	}

	onHandleClosingBottomSheet( action ) {
		this.setState( { onCloseBottomSheet: action } );
	}

	onHandleHardwareButtonPress( action ) {
		this.setState( { onHardwareButtonPress: action } );
	}

	onCloseBottomSheet() {
		const { onClose } = this.props;
		const { onCloseBottomSheet } = this.state;
		if ( onCloseBottomSheet ) {
			onCloseBottomSheet();
		}
		onClose();
	}

	onHardwareButtonPress() {
		const { onClose } = this.props;
		const { onHardwareButtonPress } = this.state;
		if ( onHardwareButtonPress ) {
			return onHardwareButtonPress();
		}
		return onClose();
	}

	onReplaceSubsheet( destination, extraProps, callback ) {
		performLayoutAnimation();

		this.setState(
			{
				currentScreen: destination,
				extraProps: extraProps || {},
			},
			callback
		);
	}

	render() {
		const {
			title = '',
			isVisible,
			leftButton,
			rightButton,
			hideHeader,
			style = {},
			contentStyle = {},
			getStylesFromColorScheme,
			onDismiss,
			children,
			...rest
		} = this.props;
		const {
			maxHeight,
			bounces,
			safeAreaBottomInset,
			isScrolling,
			scrollEnabled,
			isMaxHeightSet,
			extraProps,
			currentScreen,
		} = this.state;

		const panResponder = PanResponder.create( {
			onMoveShouldSetPanResponder: ( evt, gestureState ) => {
				// 'swiping-to-close' option is temporarily and partially disabled
				//	on Android ( swipe / drag is still available in the top most area - near drag indicator)
				if ( Platform.OS === 'ios' ) {
					// Activates swipe down over child Touchables if the swipe is long enough.
					// With this we can adjust sensibility on the swipe vs tap gestures.
					if ( gestureState.dy > 3 && ! bounces ) {
						gestureState.dy = 0;
						return true;
					}
				}
				return false;
			},
		} );

		const getHeader = () => (
			<View>
				<View style={ styles.head }>
					<View style={ { flex: 1 } }>{ leftButton }</View>
					<View style={ styles.titleContainer }>
						<Text style={ styles.title }>{ title }</Text>
					</View>
					<View style={ { flex: 1 } }>{ rightButton }</View>
				</View>
				<View style={ styles.separator } />
			</View>
		);

		const backgroundStyle = getStylesFromColorScheme(
			styles.background,
			styles.backgroundDark
		);

		return (
			<Modal
				isVisible={ isVisible }
				style={ styles.bottomModal }
				animationInTiming={ 600 }
				animationOutTiming={ 300 }
				backdropTransitionInTiming={ 50 }
				backdropTransitionOutTiming={ 50 }
				backdropOpacity={ 0.2 }
				onBackdropPress={ this.onCloseBottomSheet }
				onBackButtonPress={ this.onHardwareButtonPress }
				onSwipe={ this.onCloseBottomSheet }
				onDismiss={ Platform.OS === 'ios' ? onDismiss : undefined }
				onModalHide={
					Platform.OS === 'android' ? onDismiss : undefined
				}
				swipeDirection="down"
				onMoveShouldSetResponder={
					scrollEnabled &&
					panResponder.panHandlers.onMoveShouldSetResponder
				}
				onMoveShouldSetResponderCapture={
					scrollEnabled &&
					panResponder.panHandlers.onMoveShouldSetResponderCapture
				}
				onAccessibilityEscape={ this.onCloseBottomSheet }
				{ ...rest }
			>
				<KeyboardAvoidingView
					behavior={ Platform.OS === 'ios' && 'padding' }
					style={ {
						...backgroundStyle,
						borderColor: 'rgba(0, 0, 0, 0.1)',
						...style,
					} }
					keyboardVerticalOffset={ -safeAreaBottomInset }
				>
					<View style={ styles.dragIndicator } />
					{ ! hideHeader && getHeader() }
					<ScrollView
						disableScrollViewPanResponder
						bounces={ bounces }
						onScroll={ this.onScroll }
						onScrollBeginDrag={ () => this.isScrolling( true ) }
						onScrollEndDrag={ () => this.isScrolling( false ) }
						scrollEventThrottle={ 16 }
						style={ isMaxHeightSet ? { maxHeight } : {} }
						contentContainerStyle={ [
							styles.content,
							hideHeader && styles.emptyHeader,
							contentStyle,
						] }
						scrollEnabled={ scrollEnabled }
						automaticallyAdjustContentInsets={ false }
					>
						<BottomSheetProvider
							value={ {
								shouldEnableBottomSheetScroll: this
									.onShouldEnableScroll,
								shouldDisableBottomSheetMaxHeight: this
									.onShouldSetBottomSheetMaxHeight,
								isBottomSheetContentScrolling: isScrolling,
								onCloseBottomSheet: this
									.onHandleClosingBottomSheet,
								onHardwareButtonPress: this
									.onHandleHardwareButtonPress,
								onReplaceSubsheet: this.onReplaceSubsheet,
								extraProps,
								currentScreen,
							} }
						>
							<TouchableHighlight accessible={ false }>
								<>{ children }</>
							</TouchableHighlight>
						</BottomSheetProvider>
						<View style={ { height: safeAreaBottomInset } } />
					</ScrollView>
				</KeyboardAvoidingView>
			</Modal>
		);
	}
}

function getWidth() {
	return Math.min(
		Dimensions.get( 'window' ).width,
		styles.background.maxWidth
	);
}

const ThemedBottomSheet = withPreferredColorScheme( BottomSheet );

ThemedBottomSheet.getWidth = getWidth;
ThemedBottomSheet.Button = Button;
ThemedBottomSheet.Cell = Cell;
ThemedBottomSheet.CyclePickerCell = CyclePickerCell;
ThemedBottomSheet.PickerCell = PickerCell;
ThemedBottomSheet.SwitchCell = SwitchCell;
ThemedBottomSheet.RangeCell = RangeCell;
ThemedBottomSheet.ColorCell = ColorCell;
ThemedBottomSheet.RadioCell = RadioCell;

export default ThemedBottomSheet;
