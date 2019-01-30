/**
 * External dependencies
 */
import { Text, View } from 'react-native';
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

	headerButton( config ) {
		return (
			<Button onPress={ config.onPress }>
				<Text style={ { ...styles.buttonText, color: config.color } }>
					{ config.text }
				</Text>
			</Button>
		);
	}

	onSafeAreaInsetsUpdate( result ) {
		const { safeAreaInsets } = result;
		if ( this.state.safeAreaBottomInset !== safeAreaInsets.bottom ) {
			this.setState( { safeAreaBottomInset: safeAreaInsets.bottom } );
		}
	}

	render() {
		const { isVisible, leftButtonConfig, rightButtonConfig } = this.props;

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
				<View style={ { ...styles.content, borderColor: 'rgba(0, 0, 0, 0.1)' } }>
					<View style={ styles.dragIndicator } />
					<View style={ styles.head }>
						<View style={ { flex: 1 } }>
							{ leftButtonConfig && this.headerButton( leftButtonConfig ) }
						</View>
						<View style={ styles.titleContainer }>
							<Text style={ styles.title }>
								{ this.props.title }
							</Text>
						</View>
						<View style={ { flex: 1 } }>
							{ rightButtonConfig && this.headerButton( rightButtonConfig ) }
						</View>
					</View>

					<View style={ styles.separator } />
					{ this.props.children }
					<View style={ { flexGrow: 1 } }></View>
					<View style={ { height: this.state.safeAreaBottomInset } } />
				</View>
			</Modal>
		);
	}
}

export default BottomSheet;
