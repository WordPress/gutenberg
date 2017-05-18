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
import Dashicon from 'components/dashicon';

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
			showInfo: false,
		};
		this.toggleDialog = this.toggleDialog.bind( this );
		this.toggleVisibilityInfo = this.toggleVisibilityInfo.bind( this );
	}

	toggleDialog( event ) {
		event.preventDefault();
		this.setState( { opened: ! this.state.opened } );
	}

	toggleVisibilityInfo( event ) {
		event.preventDefault();
		this.setState( { showInfo: ! this.state.showInfo } );
	}

	handleClickOutside() {
		this.setState( { opened: false } );
	}

	render() {
		const { status, visibility, password, onUpdateVisibility } = this.props;

		const setPublic = () => onUpdateVisibility( visibility === 'private' ? 'draft' : status );
		const setPrivate = () => onUpdateVisibility( 'private' );
		const setPasswordProtected = () => onUpdateVisibility( visibility === 'private' ? 'draft' : status, password || '' );
		const updatePassword = ( event ) => onUpdateVisibility( status, event.target.value );

		const visibilityOptions = [
			{
				value: 'public',
				label: __( 'Public' ),
				info: __( 'Visible to everyone.' ),
				changeHandler: setPublic,
			},
			{
				value: 'private',
				label: __( 'Private' ),
				info: __( 'Only visible to site admins and editors.' ),
				changeHandler: setPrivate,
			},
			{
				value: 'password',
				label: __( 'Password Protected' ),
				info: __( 'Protected with a password you choose. Only those with the password can view this post.' ),
				changeHandler: setPasswordProtected,
			},
		];
		const getVisibilityLabel = () => find( visibilityOptions, { value: visibility } ).label;


		// Disable Reason: The input is inside the label, we shouldn't need the htmlFor
		/* eslint-disable jsx-a11y/label-has-for */
		return (
			<div className="editor-post-visibility">
				<span>{ __( 'Visibility' ) }</span>
				<a className="editor-post-visibility__toggle" href="" onClick={ this.toggleDialog }>
					{ getVisibilityLabel( visibility ) }
				</a>

				{ this.state.opened &&
					<div className="editor-post-visibility__dialog">
						<div className="editor-post-visibility__dialog-arrow" />
						<div className="editor-post-visibility__dialog-legend">
							{ __( 'Post Visibility' ) }
							<a className="editor-post-visibility__dialog-info-toggle" href="" onClick={ this.toggleVisibilityInfo }>
								<Dashicon icon="info" />
							</a>
						</div>
						{ visibilityOptions.map( ( { value, label, info, changeHandler } ) => (
							<label key={ value } className="editor-post-visibility__dialog-label">
								<input type="radio" value={ value } onChange={ changeHandler } checked={ value === visibility } />
								<span>{ label }</span>
								{ this.state.showInfo && <div className="editor-post-visibility__dialog-info">{ info }</div> }
							</label>
						) ) }
						{ visibility === 'password' &&
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

