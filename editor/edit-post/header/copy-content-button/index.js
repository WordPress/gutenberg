/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { ClipboardButton } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getEditedPostContent } from '../../../store/selectors';

class CopyContentButton extends Component {
	constructor() {
		super( ...arguments );
		this.state = { hasCopied: false };
		this.onCopy = this.onCopy.bind( this );
		this.onFinishCopy = this.onFinishCopy.bind( this );
	}
	onCopy() {
		this.setState( { hasCopied: true } );
	}
	onFinishCopy() {
		this.setState( { hasCopied: false } );
	}
	render() {
		return (
			<ClipboardButton
				text={ this.props.editedPostContent }
				className="components-menu-items__button"
				onCopy={ this.onCopy }
				onFinishCopy={ this.onFinishCopy }
			>
				{ this.state.hasCopied ?
					__( 'Copied!' ) :
					__( 'Copy All Content' ) }
			</ClipboardButton>
		);
	}
}

export default connect(
	( state ) => ( {
		editedPostContent: getEditedPostContent( state ),
	} )
)( CopyContentButton );
