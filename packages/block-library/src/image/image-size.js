/**
 * External dependencies
 */
import { noop } from 'lodash';

import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { fetchImageSize, renderContainer, onLayout, exporter } from './utils';

class ImageSize extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			width: undefined,
			height: undefined,
		};
		this.bindContainer = this.bindContainer.bind( this );
		this.calculateSize = this.calculateSize.bind( this );
		this.onLayout = this.onLayout.bind( this );
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
		fetchImageSize( this.props.src, this.calculateSize, ( image ) => {
			this.image = image;
		} );
	}

	onLayout( event ) {
		onLayout( event, ( container ) => {
			this.container = container;
			this.calculateSize();
		} );
	}

	calculateSize() {
		if ( this.image === undefined || this.container === undefined ) {
			return;
		}

		const maxWidth = this.container.clientWidth;
		const exceedMaxWidth = this.image.width > maxWidth;
		const ratio = this.image.height / this.image.width;
		const width = exceedMaxWidth ? maxWidth : this.image.width;
		const height = exceedMaxWidth ? maxWidth * ratio : this.image.height;
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
		return renderContainer( this.bindContainer, sizes, this.props.children, this.onLayout );
	}
}

export default exporter( ImageSize );
