/**
 * External dependencies
 */
import { View, PanResponder, Dimensions, ImageBackground } from 'react-native';
import Modal from 'react-native-modal';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

// Default Image ratio 4:3
const IMAGE_ASPECT_RATIO = 4 / 3;

class ImageViewer extends Component {
	constructor() {
		super( ...arguments );
	}

	render() {
		const {
			title = '',
			isVisible,
      		style = {},
      		url = '',
			contentStyle = {},
		} = this.props;
    
    	const self = this

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

    const imageContainerHeight = getWidth() / IMAGE_ASPECT_RATIO;

		return (
			<Modal
				isVisible={ isVisible }
				style={ styles.bottomModal }
				animationIn={ "fadeIn" }
				animationInTiming={ 1000 }
				animationOut={ "fadeOut" }
				animationOutTiming={ 250 }
				backdropTransitionInTiming={ 50 }
				backdropTransitionOutTiming={ 50 }
				backdropOpacity={ 1 }
				onBackdropPress={ this.props.onClose }
				onBackButtonPress={ this.props.onClose }
				onSwipe={ this.props.onClose }
				swipeDirection="down"
				onMoveShouldSetResponder={ panResponder.panHandlers.onMoveShouldSetResponder }
				onMoveShouldSetResponderCapture={ panResponder.panHandlers.onMoveShouldSetResponderCapture }
				onAccessibilityEscape={ this.props.onClose }
			>
				<View style={ [ styles.content, contentStyle ] }>
          			<ImageBackground
						style={ {width: getWidth(), height: imageContainerHeight} }
						source={ { uri: url } }
					/>
				</View>
			</Modal>
		);
	}
}

function getWidth() {
	return Math.min( Dimensions.get( 'window' ).width, styles.background.maxWidth );
}

ImageViewer.getWidth = getWidth;

export default ImageViewer;
