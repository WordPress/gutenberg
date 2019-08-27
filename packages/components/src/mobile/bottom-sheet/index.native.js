/**
 * External dependencies
 */
import { Text, View, Platform, PanResponder, Dimensions, Easing } from 'react-native';
import Modal from 'react-native-modal';
import SafeArea from 'react-native-safe-area';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import Button from './button';
import Cell from './cell';
import PickerCell from './picker-cell';
import SwitchCell from './switch-cell';
import KeyboardAvoidingView from './keyboard-avoiding-view';

class BottomSheet extends Component {
	constructor() {
		super( ...arguments );
		this.onSafeAreaInsetsUpdate = this.onSafeAreaInsetsUpdate.bind( this );
		this.state = {
			safeAreaBottomInset: 0,
		};

		SafeArea.getSafeAreaInsetsForRootView().then( this.onSafeAreaInsetsUpdate );
	}

	componentDidMount() {
		this.safeAreaEventSubscription = SafeArea.addEventListener( 'safeAreaInsetsForRootViewDidChange', this.onSafeAreaInsetsUpdate );
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

	render() {
		const {
			title = '',
			isVisible,
			leftButton,
			rightButton,
			hideHeader,
			style = {},
			contentStyle = {},
		} = this.props;

		const panResponder = PanResponder.create( {
			onMoveShouldSetPanResponder: ( evt, gestureState ) => {
				// Activates swipe down over child Touchables if the swipe is long enough.
				// With this we can adjust sensibility on the swipe vs tap gestures.
				if ( gestureState.dy > 3 ) {
					gestureState.dy = 0;
					return true;
				}
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

		const { height } = Dimensions.get( 'window' );
		const easing = Easing.bezier( 0.450, 0.000, 0.160, 1.020 );

		const animationIn = {
			easing,
			from: {
				translateY: height,
			},
			to: {
				translateY: 0,
			},
		};

		const animationOut = {
			easing,
			from: {
				translateY: 0,
			},
			to: {
				translateY: height,
			},
		};

		return (
			<Modal
				isVisible={ isVisible }
				style={ styles.bottomModal }
				animationIn={ animationIn }
				animationInTiming={ 600 }
				animationOut={ animationOut }
				animationOutTiming={ 250 }
				backdropTransitionInTiming={ 50 }
				backdropTransitionOutTiming={ 50 }
				backdropOpacity={ 0.2 }
				onBackdropPress={ this.props.onClose }
				onBackButtonPress={ this.props.onClose }
				onSwipe={ this.props.onClose }
				swipeDirection="down"
				onMoveShouldSetResponder={ panResponder.panHandlers.onMoveShouldSetResponder }
				onMoveShouldSetResponderCapture={ panResponder.panHandlers.onMoveShouldSetResponderCapture }
				onAccessibilityEscape={ this.props.onClose }
			>
				<KeyboardAvoidingView
					behavior={ Platform.OS === 'ios' && 'padding' }
					style={ { ...styles.background, borderColor: 'rgba(0, 0, 0, 0.1)', ...style } }
					keyboardVerticalOffset={ -this.state.safeAreaBottomInset }
				>
					<View style={ styles.dragIndicator } />
					{ hideHeader && ( <View style={ styles.emptyHeaderSpace } /> ) }
					{ ! hideHeader && getHeader() }
					<View style={ [ styles.content, contentStyle ] }>
						{ this.props.children }
					</View>
					<View style={ { height: this.state.safeAreaBottomInset } } />
				</KeyboardAvoidingView>
			</Modal>

		);
	}
}

function getWidth() {
	return Math.min( Dimensions.get( 'window' ).width, styles.background.maxWidth );
}

BottomSheet.getWidth = getWidth;
BottomSheet.Button = Button;
BottomSheet.Cell = Cell;
BottomSheet.PickerCell = PickerCell;
BottomSheet.SwitchCell = SwitchCell;

export default BottomSheet;
