/**
 * External dependencies
 */
import { View, PanResponder, Dimensions, ImageBackground, Image } from 'react-native';
import Modal from 'react-native-modal';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import { calculateFullscreenImageSize } from './utils';

class ImageViewer extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			width: undefined,
			height: undefined,
		};

		this.onDimensionsChange = this.onDimensionsChange.bind( this );
	}

	componentDidMount() {
		Dimensions.addEventListener( 'change', this.onDimensionsChange );
		this.fetchImageSize( Dimensions.get( 'window' ) );
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.url !== prevProps.url ) {
			this.fetchImageSize( Dimensions.get( 'window' ) );
		}
	}

	componentWillUnmount() {
		Dimensions.removeEventListener( 'change', this.onDimensionsChange );
	}

	onDimensionsChange( dimensions ) {
		this.fetchImageSize( dimensions.window );
	}

	fetchImageSize( dimensions ) {
		this.container = dimensions;
		Image.getSize( this.props.url, ( width, height ) => {
			this.image = { width, height };
			this.calculateSize();
		} );
	}

	calculateSize() {
		const { width, height } = calculateFullscreenImageSize( this.image, this.container );
		this.setState( { width, height } );
	}

	render() {
		const {
			isVisible,
			url = '',
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

		return (
			<Modal
				isVisible={ isVisible }
				style={ styles.modal }
				animationIn={ 'fadeIn' }
				animationInTiming={ 1000 }
				animationOut={ 'fadeOut' }
				animationOutTiming={ 1 }
				backdropTransitionInTiming={ 50 }
				backdropTransitionOutTiming={ 50 }
				backdropOpacity={ 1 }
				supportedOrientations={ [ 'portrait', 'landscape' ] }
				onBackdropPress={ this.props.onClose }
				onBackButtonPress={ this.props.onClose }
				onSwipe={ this.props.onClose }
				swipeDirection={ 'down' }
				onMoveShouldSetResponder={ panResponder.panHandlers.onMoveShouldSetResponder }
				onMoveShouldSetResponderCapture={ panResponder.panHandlers.onMoveShouldSetResponderCapture }
				onAccessibilityEscape={ this.props.onClose }
			>
				<View style={ styles.content }>
					<ImageBackground
						style={ { width: this.state.width, height: this.state.height } }
						source={ { uri: url } }
					/>
				</View>
			</Modal>
		);
	}
}

export default ImageViewer;
