/**
 * External dependencies
 */
import { Text, View, Platform, PanResponder, Dimensions, ScrollView } from 'react-native';
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
import PickerCell from './picker-cell';
import SwitchCell from './switch-cell';
import RangeCell from './range-cell';
import KeyboardAvoidingView from './keyboard-avoiding-view';

class BottomSheet extends Component {
	constructor() {
		super( ...arguments );
		this.onSafeAreaInsetsUpdate = this.onSafeAreaInsetsUpdate.bind( this );
		this.onScroll = this.onScroll.bind( this );
		this.onSetMaxHeight = this.onSetMaxHeight.bind( this );

		this.state = {
			safeAreaBottomInset: 0,
			bounces: false,
			maxHeight: 0,
		};

		SafeArea.getSafeAreaInsetsForRootView().then( this.onSafeAreaInsetsUpdate );
		Dimensions.addEventListener('change', this.onSetMaxHeight)
	}

	componentDidMount() {
		this.safeAreaEventSubscription = SafeArea.addEventListener( 'safeAreaInsetsForRootViewDidChange', this.onSafeAreaInsetsUpdate );
		this.onSetMaxHeight();
	}

	componentWillUnmount() {
		if ( this.safeAreaEventSubscription === null ) {
			return;
		}
		this.safeAreaEventSubscription.remove();
		this.safeAreaEventSubscription = null;
		SafeArea.removeEventListener( 'safeAreaInsetsForRootViewDidChange', this.onSafeAreaInsetsUpdate );
	}

	onSafeAreaInsetsUpdate( result ) {
		if ( this.safeAreaEventSubscription === null ) {
			return;
		}
		const { safeAreaInsets } = result;
		if ( this.state.safeAreaBottomInset !== safeAreaInsets.bottom ) {
			this.setState( { safeAreaBottomInset: safeAreaInsets.bottom } );
		}
	}

	isCloseToBottom( { layoutMeasurement, contentOffset, contentSize } ) {
		return layoutMeasurement.height + contentOffset.y >= contentSize.height - contentOffset.y;
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

	onSetMaxHeight() {
		const { height } = Dimensions.get('window');
		const { safeAreaBottomInset } = this.state;

		this.setState({ maxHeight: height / 2 - safeAreaBottomInset })
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
			...rest
		} = this.props;

		const panResponder = PanResponder.create( {
			onMoveShouldSetPanResponder: ( evt, gestureState ) => {
				// Temporarily disable 'swiping-to-close' option on Android
				if ( Platform.OS === 'ios' ) {
					// Activates swipe down over child Touchables if the swipe is long enough.
					// With this we can adjust sensibility on the swipe vs tap gestures.
					if ( gestureState.dy > 3 && ! this.state.bounces ) {
						gestureState.dy = 0;
						return true;
					}
				} return false;
			},
		} );

		const getHeader = () => (
			<View>
				<View style={ styles.head }>
					<View style={ { flex: 1 } }>
						{ leftButton }
					</View>
					<View style={ styles.titleContainer }>
						<Text style={ styles.title }>
							{ title }
						</Text>
					</View>
					<View style={ { flex: 1 } }>
						{ rightButton }
					</View>
				</View>
				<View style={ styles.separator } />
			</View>
		);

		const backgroundStyle = getStylesFromColorScheme( styles.background, styles.backgroundDark );

		return (
			<Modal
				isVisible={ isVisible }
				style={ styles.bottomModal }
				animationInTiming={ 600 }
				animationOutTiming={ 250 }
				backdropTransitionInTiming={ 50 }
				backdropTransitionOutTiming={ 50 }
				backdropOpacity={ 0.2 }
				onBackdropPress={ this.props.onClose }
				onBackButtonPress={ this.props.onClose }
				onSwipe={ this.props.onClose }
				onDismiss={ Platform.OS === 'ios' ? this.props.onDismiss : undefined }
				onModalHide={ Platform.OS === 'android' ? this.props.onDismiss : undefined }
				swipeDirection="down"
				onMoveShouldSetResponder={ panResponder.panHandlers.onMoveShouldSetResponder }
				onMoveShouldSetResponderCapture={ panResponder.panHandlers.onMoveShouldSetResponderCapture }
				onAccessibilityEscape={ this.props.onClose }
				{ ...rest }
			>
				<KeyboardAvoidingView
					behavior={ Platform.OS === 'ios' && 'padding' }
					style={ { ...backgroundStyle, borderColor: 'rgba(0, 0, 0, 0.1)', ...style } }
					keyboardVerticalOffset={ -this.state.safeAreaBottomInset }
				>
					<View style={ styles.dragIndicator } />
					{ ! hideHeader && getHeader() }
					<ScrollView
						bounces={ this.state.bounces }
						onScroll={ this.onScroll }
						scrollEventThrottle={ 16 }
						style={ { maxHeight: this.state.maxHeight } }
						contentContainerStyle={ [
							styles.content,
							hideHeader && styles.emptyHeader,
							{ paddingBottom: this.state.safeAreaBottomInset },
							contentStyle
						] }
					>
						{ this.props.children }
					</ScrollView>
				</KeyboardAvoidingView>
			</Modal>
		);
	}
}

function getWidth() {
	return Math.min( Dimensions.get( 'window' ).width, styles.background.maxWidth );
}

const ThemedBottomSheet = withPreferredColorScheme( BottomSheet );

ThemedBottomSheet.getWidth = getWidth;
ThemedBottomSheet.Button = Button;
ThemedBottomSheet.Cell = Cell;
ThemedBottomSheet.PickerCell = PickerCell;
ThemedBottomSheet.SwitchCell = SwitchCell;
ThemedBottomSheet.RangeCell = RangeCell;

export default ThemedBottomSheet;
