/**
 * External dependencies
 */
import { connect } from 'react-redux';
import clickOutside from 'react-click-outside';
import { find } from 'lodash';

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
	getEditedPostVisibility,
} from '../../selectors';
import { editPost, savePost } from '../../actions';

class PostVisibility extends Component {
	constructor( props ) {
		super( ...arguments );
		this.state = {
			opened: false,
			hasPassword: !! props.password,
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
		const { status, visibility, password, onUpdateVisibility, onSave } = this.props;

		const setPublic = () => {
			onUpdateVisibility( visibility === 'private' ? 'draft' : status );
			this.setState( { hasPassword: false } );
		};
		const setPrivate = () => {
			if ( window.confirm( __( 'Would you like to privately publish this post now?' ) ) ) { // eslint-disable-line no-alert
				onUpdateVisibility( 'private' );
				onSave();
				this.setState( { opened: false } );
			}
		};
		const setPasswordProtected = () => {
			onUpdateVisibility( visibility === 'private' ? 'draft' : status, password || '' );
			this.setState( { hasPassword: true } );
		};
		const updatePassword = ( event ) => onUpdateVisibility( status, event.target.value );

		const visibilityOptions = [
			{
				value: 'public',
				label: __( 'Public' ),
				info: __( 'Visible to everyone.' ),
				changeHandler: setPublic,
				checked: visibility === 'public' && ! this.state.hasPassword,
			},
			{
				value: 'private',
				label: __( 'Private' ),
				info: __( 'Only visible to site admins and editors.' ),
				changeHandler: setPrivate,
				checked: visibility === 'private',
			},
			{
				value: 'password',
				label: __( 'Password Protected' ),
				info: __( 'Protected with a password you choose. Only those with the password can view this post.' ),
				changeHandler: setPasswordProtected,
				checked: this.state.hasPassword,
			},
		];
		const getVisibilityLabel = () => find( visibilityOptions, { value: visibility } ).label;

		// Disable Reason: The input is inside the label, we shouldn't need the htmlFor
		/* eslint-disable jsx-a11y/label-has-for */
		return (
			<div className="editor-post-visibility">
				<span>{ __( 'Visibility' ) }</span>
				<button className="editor-post-visibility__toggle button-link" onClick={ this.toggleDialog }>
					{ getVisibilityLabel( visibility ) }
				</button>

				{ this.state.opened &&
					<div className="editor-post-visibility__dialog">
						<div className="editor-post-visibility__dialog-arrow" />
						<div className="editor-post-visibility__dialog-legend">
							{ __( 'Post Visibility' ) }
						</div>
						{ visibilityOptions.map( ( { value, label, info, changeHandler, checked } ) => (
							<label key={ value } className="editor-post-visibility__dialog-label">
								<input type="radio" value={ value } onChange={ changeHandler } checked={ checked } />
								{ label }
								{ <div className="editor-post-visibility__dialog-info">{ info }</div> }
							</label>
						) ) }
						{ this.state.hasPassword &&
							<input
								className="editor-post-visibility__dialog-password-input"
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
		status: getEditedPostAttribute( state, 'status' ),
		visibility: getEditedPostVisibility( state ),
		password: getEditedPostAttribute( state, 'password' ),
	} ),
	{
		onSave: savePost,
		onUpdateVisibility( status, password = null ) {
			return editPost( { status, password } );
		},
	}
)( clickOutside( PostVisibility ) );

