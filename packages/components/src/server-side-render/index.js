/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

export default class ServerSideRender extends Component {
	constructor( props ) {
		super( props );
		deprecated( 'wp.components.ServerSideRender', {
			version: '3.7',
			alternative: 'wp.editor.ServerSideRender',
		} );
	}

	render() {
		/*
		 * Since @wordpress/editor is loader later than @wordpress/components,
		 * we cannot import the new ServerSideRender from @wordpress/editor.
		 * Since we need it here for backwards compatibility, we'll just load
		 * it from the global.
		 */
		const NewServerSideRender = wp.editor.ServerSideRender;
		return <NewServerSideRender {...this.props} />;
	}
}
