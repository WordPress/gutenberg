/**
 * External dependencies
 */
import { View, Dimensions, ImageBackground, Image } from 'react-native';
import Modal from 'react-native-modal';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

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
		Image.getSize( this.props.url, ( width, height ) => {
			const { finalWidth, finalHeight } = this.calculateFullscreenImageSize( width, height, dimensions );
			this.setState( { width: finalWidth, height: finalHeight } );
		} );
	}

	calculateFullscreenImageSize( imageWidth, imageHeight, container ) {
		const imageRatio = imageWidth / imageHeight;
		const screenRatio = container.width / container.height;
		let finalWidth = container.width;
		let finalHeight = container.height;
		const shouldUseContainerHeightForImage = imageRatio < screenRatio;
		if ( shouldUseContainerHeightForImage ) {
			finalWidth = container.height * imageRatio;
		} else {
			finalHeight = container.width / imageRatio;
		}
		return { finalWidth, finalHeight };
	}

	render() {
		const {
			isVisible,
			url = '',
		} = this.props;

		return (
			<Modal
				isVisible={ isVisible }
				style={ styles.modal }
				animationIn={ 'fadeIn' }
				animationInTiming={ 1000 }
				animationOut={ 'fadeOut' }
				animationOutTiming={ 250 }
				backdropTransitionInTiming={ 50 }
				backdropTransitionOutTiming={ 50 }
				backdropOpacity={ 1 }
				supportedOrientations={ [ 'portrait', 'landscape' ] }
				onBackdropPress={ this.props.onClose }
				onBackButtonPress={ this.props.onClose }
				onSwipe={ this.props.onClose }
				swipeDirection={ 'down' }
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
