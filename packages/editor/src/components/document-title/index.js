/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

class DocumentTitle extends Component {
	constructor( props ) {
		super( props );

		deprecated( 'DocumentTitle component', {
			version: '3.8',
			plugin: 'Gutenberg',
		} );
	}

	render() {
		return null;
	}
}

export default DocumentTitle;
