/**
 * External dependencies
 */
import { Component } from 'react';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

class DocumentTitle extends Component {
	constructor( props ) {
		super( props );
		this.originalDocumentTitle = document.title;
	}

	setDocumentTitle( title ) {
		document.title = title + ' | ' + this.originalDocumentTitle;
	}

	componentDidMount() {
		this.setDocumentTitle( this.props.title );
	}

	componentWillReceiveProps( nextProps ) {
		if ( nextProps.title !== this.props.title ) {
			this.setDocumentTitle( nextProps.title );
		}
	}

	componentWillUnmount() {
		document.title = this.originalDocumentTitle;
	}

	render() {
		return null;
	}
}

export default withSelect( ( select ) => ( {
	title: select( 'core/editor' ).getDocumentTitle(),
} ) )( DocumentTitle );
