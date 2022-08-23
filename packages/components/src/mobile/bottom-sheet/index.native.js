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

class BottomSheet extends Component {
	constructor() {
		super( ...arguments );
		this.onSafeAreaInsetsUpdate = this.onSafeAreaInsetsUpdate.bind( this );
		this.onScroll = this.onScroll.bind( this );
		this.isScrolling = this.isScrolling.bind( this );
		this.onShouldEnableScroll = this.onShouldEnableScroll.bind( this );
		this.onDismiss = this.onDismiss.bind( this );
		this.onShouldSetBottomSheetMaxHeight =
			this.onShouldSetBottomSheetMaxHeight.bind( this );

		this.setIsFullScreen = this.setIsFullScreen.bind( this );

		this.onDimensionsChange = this.onDimensionsChange.bind( this );
		this.onHeaderLayout = this.onHeaderLayout.bind( this );
		this.onCloseBottomSheet = this.onCloseBottomSheet.bind( this );
		this.onHandleClosingBottomSheet =
			this.onHandleClosingBottomSheet.bind( this );
		this.onHardwareButtonPress = this.onHardwareButtonPress.bind( this );
		this.onHandleHardwareButtonPress =
			this.onHandleHardwareButtonPress.bind( this );
		this.keyboardShow = this.keyboardShow.bind( this );
		this.keyboardHide = this.keyboardHide.bind( this );

		this.headerHeight = 0;
		this.keyboardHeight = 0;
		this.lastLayoutAnimation = null;
		this.lastLayoutAnimationFinished = false;

		this.state = {
			safeAreaBottomInset: 0,
			safeAreaTopInset: 0,
			bounces: false,
			maxHeight: 0,
			scrollEnabled: true,
			isScrolling: false,
			handleClosingBottomSheet: null,
			handleHardwareButtonPress: null,
			isMaxHeightSet: true,
			isFullScreen: this.props.isFullScreen || false,
		};
	}

	keyboardShow( e ) {
		if ( ! this.props.isVisible ) {
			return;
		}

		const { height } = e.endCoordinates;
		this.keyboardHeight = height;
		this.performKeyboardLayoutAnimation( e );
		this.onSetMaxHeight();
		this.props.onKeyboardShow?.();
	}

	keyboardHide( e ) {
		if ( ! this.props.isVisible ) {
			return;
		}

		this.keyboardHeight = 0;
		this.performKeyboardLayoutAnimation( e );
		this.onSetMaxHeight();
		this.props.onKeyboardHide?.();
	}

	performKeyboardLayoutAnimation( event ) {
		const { duration, easing } = event;

		if ( duration && easing ) {
			// This layout animation is the same as the React Native's KeyboardAvoidingView component.
			// Reference: https://github.com/facebook/react-native/blob/266b21baf35e052ff28120f79c06c4f6dddc51a9/Libraries/Components/Keyboard/KeyboardAvoidingView.js#L119-L128.
			const animationConfig = {
				// We have to pass the duration equal to minimal accepted duration defined here: RCTLayoutAnimation.m.
				duration: duration > 10 ? duration : 10,
				type: LayoutAnimation.Types[ easing ] || 'keyboard',
			};
			const layoutAnimation = {
				duration: animationConfig.duration,
				update: animationConfig,
				create: {
					...animationConfig,
					property: LayoutAnimation.Properties.opacity,
				},
				delete: {
					...animationConfig,
					property: LayoutAnimation.Properties.opacity,
				},
			};
			this.lastLayoutAnimationFinished = false;
			LayoutAnimation.configureNext( layoutAnimation, () => {
				this.lastLayoutAnimationFinished = true;
			} );
			this.lastLayoutAnimation = layoutAnimation;
		} else {
			// TODO: Reinstate animations, possibly replacing `LayoutAnimation` with
			// more nuanced `Animated` usage or replacing our custom `BottomSheet`
			// with `@gorhom/bottom-sheet`. This animation was disabled to avoid a
			// preexisting bug: https://github.com/WordPress/gutenberg/issues/30562
			// this.performRegularLayoutAnimation( {
			// 	useLastLayoutAnimation: false,
			// } );.
		}
	}

	performRegularLayoutAnimation( { useLastLayoutAnimation } ) {
		// On Android, we should prevent triggering multiple layout animations at the same time because it can produce visual glitches.
		if (
			Platform.OS === 'android' &&
			this.lastLayoutAnimation &&
			! this.lastLayoutAnimationFinished
		) {
			return;
		}

		const layoutAnimation = useLastLayoutAnimation
			? this.lastLayoutAnimation || DEFAULT_LAYOUT_ANIMATION
			: DEFAULT_LAYOUT_ANIMATION;

		this.lastLayoutAnimationFinished = false;
		LayoutAnimation.configureNext( layoutAnimation, () => {
			this.lastLayoutAnimationFinished = true;
		} );
		this.lastLayoutAnimation = layoutAnimation;
	}

	componentDidMount() {
		SafeArea.getSafeAreaInsetsForRootView().then(
			this.onSafeAreaInsetsUpdate
		);

		if ( Platform.OS === 'android' ) {
			this.androidModalClosedSubscription = subscribeAndroidModalClosed(
				() => {
					this.props.onClose();
				}
			);
		}

		this.dimensionsChangeSubscription = Dimensions.addEventListener(
			'change',
			this.onDimensionsChange
		);

		// 'Will' keyboard events are not available on Android.
		// Reference: https://reactnative.dev/docs/0.61/keyboard#addlistener.
		this.keyboardShowListener = Keyboard.addListener(
			Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
			this.keyboardShow
		);
		this.keyboardHideListener = Keyboard.addListener(
			Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
			this.keyboardHide
		);

		this.safeAreaEventSubscription = SafeArea.addEventListener(
			'safeAreaInsetsForRootViewDidChange',
			this.onSafeAreaInsetsUpdate
		);
		this.onSetMaxHeight();
	}

	componentWillUnmount() {
		this.dimensionsChangeSubscription.remove();
		this.keyboardShowListener.remove();
		this.keyboardHideListener.remove();
		if ( this.androidModalClosedSubscription ) {
			this.androidModalClosedSubscription.remove();
		}
		if ( this.safeAreaEventSubscription === null ) {
			return;
		}
		this.safeAreaEventSubscription.remove();
		this.safeAreaEventSubscription = null;
	}

	onSafeAreaInsetsUpdate( result ) {
		const { safeAreaBottomInset, safeAreaTopInset } = this.state;
		if ( this.safeAreaEventSubscription === null ) {
			return;
		}
		const { safeAreaInsets } = result;
		if (
			safeAreaBottomInset !== safeAreaInsets.bottom ||
			safeAreaTopInset !== safeAreaInsets.top
		) {
			this.setState( {
				safeAreaBottomInset: safeAreaInsets.bottom,
				safeAreaTopInset: safeAreaInsets.top,
			} );
		}
	}

	onSetMaxHeight() {
		const { height, width } = Dimensions.get( 'window' );
		const { safeAreaBottomInset } = this.state;
		const statusBarHeight =
			Platform.OS === 'android' ? StatusBar.currentHeight : 0;

		// `maxHeight` when modal is opened along with a keyboard.
		const maxHeightWithOpenKeyboard =
			0.95 *
			( Dimensions.get( 'window' ).height -
				this.keyboardHeight -
				statusBarHeight -
				this.headerHeight );

		// In landscape orientation, set `maxHeight` to ~96% of the height.
		if ( width > height ) {
			this.setState( {
				maxHeight: Math.min(
					0.96 * height - this.headerHeight,
					maxHeightWithOpenKeyboard
				),
			} );
			// In portrait orientation, set `maxHeight` to ~59% of the height.
		} else {
			this.setState( {
				maxHeight: Math.min(
					height * 0.59 - safeAreaBottomInset - this.headerHeight,
					maxHeightWithOpenKeyboard
				),
			} );
		}
	}

	onDimensionsChange() {
		this.onSetMaxHeight();
		this.setState( { bounces: false } );
	}

	onHeaderLayout( { nativeEvent } ) {
		const { height } = nativeEvent.layout;
		// The layout animation should only be triggered if the header
		// height has changed after being mounted.
		if (
			this.headerHeight !== 0 &&
			Math.round( height ) !== Math.round( this.headerHeight )
		) {
			this.performRegularLayoutAnimation( {
				useLastLayoutAnimation: true,
			} );
		}
		this.headerHeight = height;
		this.onSetMaxHeight();
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
		} else {
			this.setState( { bounces: true } );
		}
	}

	onDismiss() {
		const { onDismiss } = this.props;

		if ( onDismiss ) {
			onDismiss();
		}

		this.onCloseBottomSheet();
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
		this.setState( { handleClosingBottomSheet: action } );
	}

	onHandleHardwareButtonPress( action ) {
		this.setState( { handleHardwareButtonPress: action } );
	}

	onCloseBottomSheet() {
		const { onClose } = this.props;
		const { handleClosingBottomSheet } = this.state;
		if ( handleClosingBottomSheet ) {
			handleClosingBottomSheet();
			this.onHandleClosingBottomSheet( null );
		}
		if ( onClose ) {
			onClose();
		}
		this.onShouldSetBottomSheetMaxHeight( true );
	}

	setIsFullScreen( isFullScreen ) {
		if ( isFullScreen !== this.state.isFullScreen ) {
			if ( isFullScreen ) {
				this.setState( { isFullScreen, isMaxHeightSet: false } );
			} else {
				this.setState( { isFullScreen, isMaxHeightSet: true } );
			}
		}
	}

	onHardwareButtonPress() {
		const { onClose } = this.props;
		const { handleHardwareButtonPress } = this.state;
		if ( handleHardwareButtonPress && handleHardwareButtonPress() ) {
			return;
		}
		if ( onClose ) {
			return onClose();
		}
	}

	getContentStyle() {
		const { safeAreaBottomInset } = this.state;
		return {
			paddingBottom:
				( safeAreaBottomInset || 0 ) +
				styles.scrollableContent.paddingBottom,
		};
	}

	render() {
		const {
			title = '',
			isVisible,
			leftButton,
			rightButton,
			header,
			hideHeader,
			style = {},
			contentStyle = {},
			getStylesFromColorScheme,
			children,
			withHeaderSeparator = false,
			hasNavigation,
			onDismiss,
			...rest
		} = this.props;
		const {
			maxHeight,
			bounces,
			safeAreaBottomInset,
			safeAreaTopInset,
			isScrolling,
			scrollEnabled,
			isMaxHeightSet,
			isFullScreen,
		} = this.state;

		const panResponder = PanResponder.create( {
			onMoveShouldSetPanResponder: ( evt, gestureState ) => {
				// 'swiping-to-close' option is temporarily and partially disabled
				// on Android ( swipe / drag is still available in the top most area - near drag indicator).
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

		const backgroundStyle = getStylesFromColorScheme(
			styles.background,
			styles.backgroundDark
		);

		const bottomSheetHeaderTitleStyle = getStylesFromColorScheme(
			styles.bottomSheetHeaderTitle,
			styles.bottomSheetHeaderTitleDark
		);

		let listStyle = {};
		if ( isFullScreen ) {
			listStyle = { flexGrow: 1, flexShrink: 1 };
		} else if ( isMaxHeightSet ) {
			listStyle = { maxHeight };

			// Allow setting a "static" height of the bottom sheet
			// by setting the min height to the max height.
			if ( this.props.setMinHeightToMaxHeight ) {
				listStyle.minHeight = maxHeight;
			}
		}

		const listProps = {
			disableScrollViewPanResponder: true,
			bounces,
			onScroll: this.onScroll,
			onScrollBeginDrag: this.onScrollBeginDrag,
			onScrollEndDrag: this.onScrollEndDrag,
			scrollEventThrottle: 16,
			contentContainerStyle: [
				styles.content,
				hideHeader && styles.emptyHeader,
				contentStyle,
				isFullScreen && { flexGrow: 1 },
			],
			style: listStyle,
			safeAreaBottomInset,
			scrollEnabled,
			automaticallyAdjustContentInsets: false,
		};

		const WrapperView = hasNavigation ? View : ScrollView;

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

		const showDragIndicator = () => {
			// If iOS or not fullscreen show the drag indicator.
			if ( Platform.OS === 'ios' || ! this.state.isFullScreen ) {
				return true;
			}

			// Otherwise check the allowDragIndicator.
			return this.props.allowDragIndicator;
		};

		return (
			<Modal
				isVisible={ isVisible }
				style={ styles.bottomModal }
				animationInTiming={ 400 }
				animationOutTiming={ 300 }
				backdropTransitionInTiming={ 50 }
				backdropTransitionOutTiming={ 50 }
				backdropOpacity={ 0.2 }
				onBackdropPress={ this.onCloseBottomSheet }
				onBackButtonPress={ this.onHardwareButtonPress }
				onSwipeComplete={ this.onCloseBottomSheet }
				onDismiss={ Platform.OS === 'ios' ? this.onDismiss : undefined }
				onModalHide={
					Platform.OS === 'android' ? this.onDismiss : undefined
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
						marginTop:
							Platform.OS === 'ios' && isFullScreen
								? safeAreaTopInset
								: 0,
						flex: isFullScreen ? 1 : undefined,
						...( Platform.OS === 'android' && isFullScreen
							? styles.backgroundFullScreen
							: {} ),
						...style,
					} }
					keyboardVerticalOffset={ -safeAreaBottomInset }
				>
					<View
						style={ styles.header }
						onLayout={ this.onHeaderLayout }
						testID={ `${ rest.testID || 'bottom-sheet' }-header` }
					>
						{ showDragIndicator() && (
							<View style={ styles.dragIndicator } />
						) }
						{ ! hideHeader && getHeader() }
					</View>
					<WrapperView
						{ ...( hasNavigation
							? { style: listProps.style }
							: listProps ) }
					>
						<BottomSheetProvider
							value={ {
								shouldEnableBottomSheetScroll:
									this.onShouldEnableScroll,
								shouldEnableBottomSheetMaxHeight:
									this.onShouldSetBottomSheetMaxHeight,
								isBottomSheetContentScrolling: isScrolling,
								onHandleClosingBottomSheet:
									this.onHandleClosingBottomSheet,
								onHandleHardwareButtonPress:
									this.onHandleHardwareButtonPress,
								listProps,
								setIsFullScreen: this.setIsFullScreen,
								safeAreaBottomInset,
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
										safeAreaBottomInset ||
										styles.scrollableContent.paddingBottom,
								} }
							/>
						) }
					</WrapperView>
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
ThemedBottomSheet.SubSheet = BottomSheetSubSheet;
ThemedBottomSheet.NavBar = NavBar;
ThemedBottomSheet.CyclePickerCell = CyclePickerCell;
ThemedBottomSheet.PickerCell = PickerCell;
ThemedBottomSheet.SwitchCell = SwitchCell;
ThemedBottomSheet.RangeCell = RangeCell;
ThemedBottomSheet.ColorCell = ColorCell;
ThemedBottomSheet.LinkCell = LinkCell;
ThemedBottomSheet.LinkSuggestionItemCell = LinkSuggestionItemCell;
ThemedBottomSheet.RadioCell = RadioCell;
ThemedBottomSheet.NavigationScreen = NavigationScreen;
ThemedBottomSheet.NavigationContainer = NavigationContainer;

export default ThemedBottomSheet;
