/**
 * External dependencies
 */
import {
	Text,
	View,
	Platform,
	Dimensions,
	Keyboard,
	StatusBar,
	Modal as RNModal,
	ScrollView,
	TouchableOpacity,
} from 'react-native';
import SafeArea from 'react-native-safe-area';
import { subscribeAndroidModalClosed } from 'react-native-gutenberg-bridge';
import Animated from 'react-native-reanimated';
/**
 * Internal dependencies
 */
import { BottomSheetProvider } from './bottom-sheet-context';

/**
 * WordPress dependencies
 */
import { Component, createRef } from '@wordpress/element';
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
import KeyboardAvoidingView from './keyboard-avoiding-view';

import BottomSheetReanimated from 'reanimated-bottom-sheet';

const windowHeight = Dimensions.get( 'window' ).height;

const defaultSnapPoints = [
	windowHeight * 0.8,
	windowHeight * 0.5,
	windowHeight * 0.25,
	0,
];

const defaultInitialSnap = 2;

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
		this.keyboardWillShow = this.keyboardWillShow.bind( this );
		this.keyboardDidHide = this.keyboardDidHide.bind( this );
		this.renderContent = this.renderContent.bind( this );
		this.openEnd = this.openEnd.bind( this );
		this.closeStart = this.closeStart.bind( this );
		this.renderHandler = this.renderHandler.bind( this );
		this.onOverlayPress = this.onOverlayPress.bind( this );
		this.state = {
			safeAreaBottomInset: 0,
			bounces: false,
			maxHeight: 0,
			keyboardHeight: 0,
			scrollEnabled: false,
			isScrolling: false,
			onCloseBottomSheet: null,
			onHardwareButtonPress: null,
			isMaxHeightSet: true,
			extraProps: {},
		};

		this.bottomSheetRef = createRef();

		SafeArea.getSafeAreaInsetsForRootView().then(
			this.onSafeAreaInsetsUpdate
		);
		Dimensions.addEventListener( 'change', this.onDimensionsChange );
		this.overlayOpacity = new Animated.Value( 1 );
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

	onOverlayPress() {
		const { snapPoints = defaultSnapPoints } = this.props;
		if ( this.bottomSheetRef.current ) {
			this.bottomSheetRef.current.snapTo( snapPoints.length - 1 );
		}
	}

	getHeader() {
		const { title = '', leftButton, rightButton } = this.props;
		return (
			<View>
				<View>
					<View style={ { flex: 1 } }>{ leftButton }</View>
					<View style={ styles.titleContainer }>
						<Text style={ styles.title }>{ title }</Text>
					</View>
					<View style={ { flex: 1 } }>{ rightButton }</View>
				</View>
				<View style={ styles.separator } />
			</View>
		);
	}

	renderHandler() {
		const { getStylesFromColorScheme } = this.props;

		const backgroundStyle = getStylesFromColorScheme(
			styles.background,
			styles.backgroundDark
		);

		return (
			<View style={ [ styles.handler, backgroundStyle ] }>
				<View style={ styles.dragIndicator } />
			</View>
		);
	}

	renderContent() {
		const {
			getStylesFromColorScheme,
			children,
			hideHeader,
			contentStyle,
		} = this.props;
		const { scrollEnabled } = this.state;
		const backgroundStyle = getStylesFromColorScheme(
			styles.background,
			styles.backgroundDark
		);

		return (
			<View style={ [ { height: '100%' }, backgroundStyle ] }>
				{ ! hideHeader && this.getHeader() }
				<ScrollView
					disableScrollViewPanResponder
					showsHorizontalScrollIndicator={ false }
					showsVerticalScrollIndicator={ false }
					contentContainerStyle={ [ styles.content, contentStyle ] }
					scrollEnabled={ scrollEnabled }
					automaticallyAdjustContentInsets={ false }
				>
					<BottomSheetProvider
						value={ {
							shouldEnableBottomSheetScroll: this
								.onShouldEnableScroll,
							shouldDisableBottomSheetMaxHeight: this
								.onShouldSetBottomSheetMaxHeight,
							onCloseBottomSheet: this.onHandleClosingBottomSheet,
							onHardwareButtonPress: this
								.onHandleHardwareButtonPress,
						} }
					>
						{ children }
					</BottomSheetProvider>
				</ScrollView>
			</View>
		);
	}

	openEnd() {
		this.onShouldEnableScroll( true );
	}

	closeStart() {
		this.onShouldEnableScroll( false );
	}

	render() {
		const {
			isVisible,
			style = {},
			snapPoints = defaultSnapPoints,
			initialSnap = defaultInitialSnap,
		} = this.props;
		const { safeAreaBottomInset, scrollEnabled } = this.state;

		return (
			<RNModal visible={ isVisible } transparent={ true }>
				<KeyboardAvoidingView
					behavior={ Platform.OS === 'ios' && 'padding' }
					style={ {
						...style,
						flex: 1,
					} }
					keyboardVerticalOffset={ -safeAreaBottomInset }
				>
					<Animated.View
						style={ {
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							backgroundColor: 'black',
							opacity: Animated.sub(
								0.7,
								Animated.multiply( this.overlayOpacity, 0.7 )
							),
						} }
					>
						<TouchableOpacity
							style={ { flex: 1 } }
							onPress={ this.onOverlayPress }
						/>
					</Animated.View>
					<BottomSheetReanimated
						key={ `${ JSON.stringify( snapPoints ) }` }
						snapPoints={ snapPoints }
						initialSnap={ initialSnap }
						renderHeader={ this.renderHandler }
						renderContent={ this.renderContent }
						callbackNode={ this.overlayOpacity }
						onCloseEnd={ this.onCloseBottomSheet }
						enabledContentGestureInteraction={ ! scrollEnabled }
						enabledHeaderGestureInteraction
						onOpenEnd={ this.openEnd }
						onCloseStart={ this.closeStart }
						ref={ this.bottomSheetRef }
					/>
				</KeyboardAvoidingView>
			</RNModal>
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

export default ThemedBottomSheet;
