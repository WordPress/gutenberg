/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Dashicon, ClipboardButton, Button } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import { isEditedPostNew, getEditedPostAttribute } from '../../store/selectors';

class PostPermalink extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			showCopyConfirmation: false,
		};
		this.onCopy = this.onCopy.bind( this );
		this.onFinishCopy = this.onFinishCopy.bind( this );
	}

	componentWillUnmount() {
		clearTimeout( this.dismissCopyConfirmation );
	}

	onCopy() {
		this.setState( {
			showCopyConfirmation: true,
		} );
	}

	onFinishCopy() {
		this.setState( {
			showCopyConfirmation: false,
		} );
	}

	render() {
		const { isNew, link } = this.props;
		if ( isNew || ! link ) {
			return null;
		}

		return (
			<div className="editor-post-permalink">
				<Dashicon icon="admin-links" />
				<span className="editor-post-permalink__label">{ __( 'Permalink:' ) }</span>
				<Button className="editor-post-permalink__link" href={ link } target="_blank">
					{ link }
				</Button>
				<ClipboardButton
					className="button"
					text={ link }
					onCopy={ this.onCopy }
					onFinishCopy={ this.onFinishCopy }
				>
					{ this.state.showCopyConfirmation ? __( 'Copied!' ) : __( 'Copy' ) }
				</ClipboardButton>
			</div>
		);
	}
}

export default connect(
	( state ) => {
		return {
			isNew: isEditedPostNew( state ),
			link: getEditedPostAttribute( state, 'link' ),
		};
	}
)( PostPermalink );

