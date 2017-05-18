/**
 * External dependencies
 */
import { connect } from 'react-redux';
import clickOutside from 'react-click-outside';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Component } from 'element';

/**
 * Internal Dependencies
 */
import './style.scss';
import {
	getEditedPostAttribute,
	getEditedPostStatus,
	getEditedPostVisibility,
} from '../../selectors';
import { editPost } from '../../actions';

class PostVisibility extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			opened: false,
		};
		this.toggleDialog = this.toggleDialog.bind( this );
	}

	toggleDialog( event ) {
		event.preventDefault();
		this.setState( { opened: ! this.state.opened } );
	}

	handleClickOutside() {
		this.setState( { opened: false } );
	}

	render() {
		const { status, visibility, password, onUpdateVisibility } = this.props;
		const visibilityLabels = {
			'public': __( 'Public' ),
			'private': __( 'Private' ),
			password: __( 'Password Protected' ),
		};

		const setPublic = () => onUpdateVisibility( visibility === 'private' ? 'draft' : status );
		const setPrivate = () => onUpdateVisibility( 'private' );
		const setPasswordProtected = () => onUpdateVisibility( visibility === 'private' ? 'draft' : status, password || '' );
		const updatePassword = ( event ) => onUpdateVisibility( status, event.target.value );

		// Disable Reason: The input is inside the label, we shouldn't need the htmlFor
		/* eslint-disable jsx-a11y/label-has-for */
		return (
			<div className="editor-post-visibility">
				<span>{ __( 'Visibility' ) }</span>
				<a href="" onClick={ this.toggleDialog }>{ visibilityLabels[ visibility ] }</a>

				{ this.state.opened &&
					<div className="editor-post-visibility__dialog">
						<div className="editor-post-visibility__dialog-arrow" />
						<div className="editor-post-visibility__dialog-legend">
							{ __( 'Post Visibility' ) }
						</div>
						<label className="editor-post-visibility__dialog-label">
							<input type="radio" value="public" onChange={ setPublic } checked={ 'public' === visibility } />
							<span>{ visibilityLabels.public }</span>
						</label>
						<label className="editor-post-visibility__dialog-label">
							<input type="radio" value="private" onChange={ setPrivate } checked={ 'private' === visibility } />
							<span>{ visibilityLabels.private }</span>
						</label>
						<label className="editor-post-visibility__dialog-label">
							<input type="radio" value="password" onChange={ setPasswordProtected } checked={ 'password' === visibility } />
							<span>{ visibilityLabels.password }</span>
						</label>
						{ visibility === 'password' &&
							<input
								type="text"
								onChange={ updatePassword }
								value={ password }
								placeholder={ __( 'Create password' ) }
							/>
						}
					</div>
				}
			</div>
		);
		/* eslint-enable jsx-a11y/label-has-for */
	}
}

export default connect(
	( state ) => ( {
		status: getEditedPostStatus( state ),
		visibility: getEditedPostVisibility( state ),
		password: getEditedPostAttribute( state, 'password' ),
	} ),
	( dispatch ) => {
		return {
			onUpdateVisibility( status, password = null ) {
				dispatch( editPost( { status, password } ) );
			},
		};
	}
)( clickOutside( PostVisibility ) );

