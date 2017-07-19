/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { Component } from 'react';

/**
 * Internal dependencies
 */
import { getDocumentTitle } from '../selectors';

class DocumentTitle extends Component {
	componentWillMount() {
		this.originalDocumentTitle = document.title;
	}

	render() {
		document.title = this.props.title + ' | ' + this.originalDocumentTitle;
		return null;
	}

	componentWillUnmount() {
		document.title = this.originalDocumentTitle;
	}
}

export default connect(
	( state ) => ( {
		title: getDocumentTitle( state ),
	} )
)( DocumentTitle );
