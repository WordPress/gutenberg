/**
 * External dependencies
 */
import { Text, View, KeyboardAvoidingView, Platform } from 'react-native';
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
		SafeArea.addEventListener( 'safeAreaInsetsForRootViewDidChange', this.onSafeAreaInsetsUpdate );
	}

	componentWillUnmount() {
		SafeArea.removeEventListener( 'safeAreaInsetsForRootViewDidChange', this.onSafeAreaInsetsUpdate );
	}

	onSafeAreaInsetsUpdate( result ) {
		const { safeAreaInsets } = result;
		if ( this.state.safeAreaBottomInset !== safeAreaInsets.bottom ) {
			this.setState( { safeAreaBottomInset: safeAreaInsets.bottom } );
		}
	}

	render() {
		const { title = '', isVisible, leftButton, rightButton, hideHeader } = this.props;

		return (
			<Modal
				isVisible={ isVisible }
				style={ styles.bottomModal }
				animationInTiming={ 500 }
				animationOutTiming={ 500 }
				backdropTransitionInTiming={ 500 }
				backdropTransitionOutTiming={ 500 }
				onBackdropPress={ this.props.onClose }
				onSwipe={ this.props.onClose }
				swipeDirection="down"
			>
				<KeyboardAvoidingView
					behavior={ Platform.OS === 'ios' && 'padding' }
					style={ { ...styles.content, borderColor: 'rgba(0, 0, 0, 0.1)' } }
					keyboardVerticalOffset={ -this.state.safeAreaBottomInset }
				>
					<View style={ styles.dragIndicator } />
					{ hideHeader || (
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
					) }
					{ this.props.children }
					<View style={ { flexGrow: 1 } }></View>
					<View style={ { height: this.state.safeAreaBottomInset } } />
				</KeyboardAvoidingView>
			</Modal>

		);
	}
}

BottomSheet.Button = Button;
BottomSheet.Cell = Cell;

export default BottomSheet;
