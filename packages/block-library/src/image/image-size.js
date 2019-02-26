/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { withGlobalEvents } from '@wordpress/compose';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { calculatePreferedImageSize } from './utils';

class ImageSize extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			width: undefined,
			height: undefined,
		};
		this.bindContainer = this.bindContainer.bind( this );
		this.calculateSize = this.calculateSize.bind( this );
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

		if ( this.props.dirtynessTrigger !== prevProps.dirtynessTrigger ) {
			this.calculateSize();
		}
	}

	componentDidMount() {
		this.fetchImageSize();
	}

	componentWillUnmount() {
		if ( this.image ) {
			this.image.onload = noop;
		}
	}

	fetchImageSize() {
		this.image = new window.Image();
		this.image.onload = this.calculateSize;
		this.image.src = this.props.src;
	}

	calculateSize() {
		const { width, height } = calculatePreferedImageSize( this.image, this.container );
		this.setState( { width, height } );
	}

	render() {
		const sizes = {
			imageWidth: this.image && this.image.width,
			imageHeight: this.image && this.image.height,
			containerWidth: this.container && this.container.clientWidth,
			containerHeight: this.container && this.container.clientHeight,
			imageWidthWithinContainer: this.state.width,
			imageHeightWithinContainer: this.state.height,
		};
		return (
			<div ref={ this.bindContainer }>
				{ this.props.children( sizes ) }
			</div>
		);
	}
}

export default withGlobalEvents( {
	resize: 'calculateSize',
} )( ImageSize );
