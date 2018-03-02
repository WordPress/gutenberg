/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { Component } from 'react';

/**
 * Internal dependencies
 */
import { getDocumentTitle } from '../../store/selectors';

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

export default connect(
	( state ) => ( {
		title: getDocumentTitle( state ),
	} ),
)( DocumentTitle );
