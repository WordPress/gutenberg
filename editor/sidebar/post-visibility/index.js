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

		this.toggleDialog = this.toggleDialog.bind( this );
		this.setPublic = this.setPublic.bind( this );
		this.setPrivate = this.setPrivate.bind( this );
		this.setPasswordProtected = this.setPasswordProtected.bind( this );

		this.state = {
			opened: false,
			hasPassword: !! props.password,
		};
	}

	toggleDialog( event ) {
		event.preventDefault();
		this.setState( { opened: ! this.state.opened } );
	}

	setPublic() {
		const { visibility, onUpdateVisibility, status } = this.props;

		onUpdateVisibility( visibility === 'private' ? 'draft' : status );
		this.setState( { hasPassword: false } );
	}

	setPrivate() {
		if ( ! window.confirm( __( 'Would you like to privately publish this post now?' ) ) ) { // eslint-disable-line no-alert
			return;
		}

		const { onUpdateVisibility, onSave } = this.props;

		onUpdateVisibility( 'private' );
		onSave();
		this.setState( { opened: false } );
	}

	setPasswordProtected() {
		const { visibility, onUpdateVisibility, status, password } = this.props;

		onUpdateVisibility( visibility === 'private' ? 'draft' : status, password || '' );
		this.setState( { hasPassword: true } );
	}

	handleClickOutside() {
		this.setState( { opened: false } );
	}

	render() {
		const { status, visibility, password, onUpdateVisibility } = this.props;

		const updatePassword = ( event ) => onUpdateVisibility( status, event.target.value );

		const visibilityOptions = [
			{
				value: 'public',
				label: __( 'Public' ),
				info: __( 'Visible to everyone.' ),
				onSelect: this.setPublic,
				checked: visibility === 'public' && ! this.state.hasPassword,
			},
			{
				value: 'private',
				label: __( 'Private' ),
				info: __( 'Only visible to site admins and editors.' ),
				onSelect: this.setPrivate,
				checked: visibility === 'private',
			},
			{
				value: 'password',
				label: __( 'Password Protected' ),
				info: __( 'Protected with a password you choose. Only those with the password can view this post.' ),
				onSelect: this.setPasswordProtected,
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
						{ visibilityOptions.map( ( { value, label, info, onSelect, checked } ) => (
							<label key={ value } className="editor-post-visibility__dialog-label">
								<input
									type="radio"
									value={ value }
									onChange={ onSelect }
									checked={ checked } />
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

