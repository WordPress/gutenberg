/**
 * External dependencies
 */
import jQuery from 'jquery';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withContext } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';

class MediaButtons extends Component {
	constructor() {
		super( ...arguments );
		this.bindContainer = this.bindContainer.bind( this );
	}

	componentDidMount() {
		if ( this.props.mediaButtons ) {
			// Using jQuery to ensure the scripts are being executed
			jQuery( this.container ).html( this.props.mediaButtons );
			// eslint-disable-next-line no-console
			console.warn( 'Media Buttons are deprecated, create custom blocks instead. https://wordpress.org/gutenberg/handbook/blocks/' );
		}
	}

	bindContainer( ref ) {
		this.container = ref;
	}

	render() {
		return (
			<div className="editor-media-buttons" ref={ this.bindContainer } />
		);
	}
}

export default withContext( 'editor' )( ( settings ) => {
	const { mediaButtons } = settings;

	return {
		mediaButtons,
	};
} )( MediaButtons );
