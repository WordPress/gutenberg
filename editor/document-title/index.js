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
	render() {
		document.title = this.props.title;
		return null;
	}
}

export default connect(
	( state ) => ( {
		title: getDocumentTitle( state ),
	} )
)( DocumentTitle );
