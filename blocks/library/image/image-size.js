/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from 'element';

class ImageSize extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			width: undefined,
			height: undefined,
		};
		this.bindContainer = this.bindContainer.bind( this );
	}

	bindContainer( ref ) {
		this.container = ref;
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.src !== prevProps.src ) {
			this.setState( {
				width: undefined,
				height: undefined,
			} );
			this.fetchImageSize();
		}
	}

	componentDidMount() {
		this.fetchImageSize();
	}

	componentWillUnmout() {
		if ( this.image ) {
			this.image.src = noop;
		}
	}

	fetchImageSize() {
		this.image = new Image();
		this.image.onload = () => {
			const maxWidth = this.container.clientWidth;
			const ratio = this.image.height / this.image.width;
			const width = this.image.width < maxWidth ? this.image.width : maxWidth;
			const height = this.image.width < maxWidth ? this.image.height : maxWidth * ratio;
			this.setState( { width, height } );
		};
		this.image.src = this.props.src;
	}

	render() {
		return (
			<div ref={ this.bindContainer }>
				{ this.props.children( this.state.width, this.state.height ) }
			</div>
		);
	}
}

export default ImageSize;
