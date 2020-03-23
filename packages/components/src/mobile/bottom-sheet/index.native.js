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
} from 'react-native';
import Modal from 'react-native-modal';
import SafeArea from 'react-native-safe-area';

/**
 * WordPress dependencies
 */
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
import KeyboardAvoidingView from './keyboard-avoiding-view';

class BottomSheet extends Component {
	constructor() {
		super( ...arguments );
		this.onSafeAreaInsetsUpdate = this.onSafeAreaInsetsUpdate.bind( this );
		this.onScroll = this.onScroll.bind( this );
		this.onDimensionsChange = this.onDimensionsChange.bind( this );
		this.keyboardWillShow = this.keyboardWillShow.bind( this );
		this.keyboardDidHide = this.keyboardDidHide.bind( this );

		this.state = {
			safeAreaBottomInset: 0,
			bounces: false,
			maxHeight: 0,
			keyboardHeight: 0,
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

		// `maxHeight` when modal is opened alon with a keyboard
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
		}
		if ( this.isCloseToBottom( nativeEvent ) ) {
			this.setState( { bounces: true } );
		}
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
			onClose,
			onDismiss,
			children,
			...rest
		} = this.props;
		const { maxHeight, bounces, safeAreaBottomInset } = this.state;

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
				animationOutTiming={ 250 }
				backdropTransitionInTiming={ 50 }
				backdropTransitionOutTiming={ 50 }
				backdropOpacity={ 0.2 }
				onBackdropPress={ onClose }
				onBackButtonPress={ onClose }
				onSwipe={ onClose }
				onDismiss={ Platform.OS === 'ios' ? onDismiss : undefined }
				onModalHide={
					Platform.OS === 'android' ? onDismiss : undefined
				}
				swipeDirection="down"
				onMoveShouldSetResponder={
					panResponder.panHandlers.onMoveShouldSetResponder
				}
				onMoveShouldSetResponderCapture={
					panResponder.panHandlers.onMoveShouldSetResponderCapture
				}
				onAccessibilityEscape={ onClose }
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
						scrollEventThrottle={ 16 }
						style={ { maxHeight } }
						contentContainerStyle={ [
							styles.content,
							hideHeader && styles.emptyHeader,
							contentStyle,
						] }
					>
						{ children }
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

export default ThemedBottomSheet;
