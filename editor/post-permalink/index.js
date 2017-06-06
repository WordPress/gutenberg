/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { __ } from 'i18n';
import { Dashicon, ClipboardButton } from 'components';

/**
 * Internal Dependencies
 */
import './style.scss';
import { getEditedPostAttribute } from '../selectors';

class PostPermalink extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			showCopyConfirmation: false,
		};
		this.onCopy = this.onCopy.bind( this );
	}

	componentWillUnmout() {
		clearTimeout( this.dismissCopyConfirmation );
	}

	onCopy() {
		this.setState( {
			showCopyConfirmation: true,
		} );

		clearTimeout( this.dismissCopyConfirmation );
		this.dismissCopyConfirmation = setTimeout( () => {
			this.setState( {
				showCopyConfirmation: false,
			} );
		}, 4000 );
	}

	render() {
		const { link } = this.props;
		if ( ! link ) {
			return null;
		}

		return (
			<div className="editor-post-permalink">
				<Dashicon icon="admin-links" />
				<span className="editor-post-permalink__label">{ __( 'Permalink:' ) }</span>
				<span className="editor-post-permalink__link">{ link }</span>
				<ClipboardButton className="button" text={ link } onCopy={ this.onCopy }>
					{ this.state.showCopyConfirmation ? __( 'Copied!' ) : __( 'Copy' ) }
				</ClipboardButton>
			</div>
		);
	}
}

export default connect(
	( state ) => {
		return {
			link: getEditedPostAttribute( state, 'link' ),
		};
	}
)( PostPermalink );

