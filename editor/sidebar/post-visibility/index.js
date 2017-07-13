/**
 * External dependencies
 */
import { connect } from 'react-redux';
import clickOutside from 'react-click-outside';
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, findDOMNode } from '@wordpress/element';
import { PanelRow, Popover, withInstanceId } from '@wordpress/components';
import { keycodes } from '@wordpress/utils';

/**
 * Internal Dependencies
 */
import './style.scss';
import {
	getEditedPostAttribute,
	getEditedPostVisibility,
} from '../../selectors';
import { editPost, savePost } from '../../actions';

const { ESCAPE } = keycodes;

class PostVisibility extends Component {
	constructor( props ) {
		super( ...arguments );

		this.toggleDialog = this.toggleDialog.bind( this );
		this.setPublic = this.setPublic.bind( this );
		this.setPrivate = this.setPrivate.bind( this );
		this.setPasswordProtected = this.setPasswordProtected.bind( this );
		this.handleKeyDown = this.handleKeyDown.bind( this );
		this.handleBlur = this.handleBlur.bind( this );

		this.state = {
			opened: false,
			hasPassword: !! props.password,
		};
	}

	toggleDialog() {
		this.setState( ( state ) => ( { opened: ! state.opened } ) );
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
		this.setState( { hasPassword: false } );
		onSave();
	}

	setPasswordProtected() {
		const { visibility, onUpdateVisibility, status, password } = this.props;

		onUpdateVisibility( visibility === 'private' ? 'draft' : status, password || '' );
		this.setState( { hasPassword: true } );
	}

	handleClickOutside() {
		this.setState( { opened: false } );
	}

	handleBlur( event ) {
		if ( this.state.opened && event.relatedTarget !== null ) {
			const wrapper = findDOMNode( this );
			const toggle = wrapper.querySelector( '.editor-post-visibility__toggle' );
			const dialog = wrapper.querySelector( '.editor-post-visibility__dialog' );

			if ( ! dialog.contains( event.relatedTarget ) ) {
				this.setState( { opened: false } );
				toggle.focus();
			}
		}
	}

	handleKeyDown( event ) {
		if ( this.state.opened && event.keyCode === ESCAPE ) {
			const wrapper = findDOMNode( this );
			const toggle = wrapper.querySelector( '.editor-post-visibility__toggle' );

			if ( event.target === toggle ) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();
			this.setState( { opened: false } );
			toggle.focus();
		}
	}

	componentDidMount() {
		const node = findDOMNode( this );
		node.addEventListener( 'keydown', this.handleKeyDown, false );
	}

	componentWillUnmount() {
		const node = findDOMNode( this );
		node.removeEventListener( 'keydown', this.handleKeyDown, false );
	}

	render() {
		const { status, visibility, password, onUpdateVisibility, instanceId } = this.props;

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

		return (
			<PanelRow className="editor-post-visibility">
				<span>{ __( 'Visibility' ) }</span>
				<span className="editor-post-visibility__button-wrapper">
					<button
						type="button"
						aria-expanded={ this.state.opened }
						className="editor-post-visibility__toggle button-link"
						onClick={ this.toggleDialog }
					>
						{ getVisibilityLabel( visibility ) }
					</button>

					{ this.state.opened &&
						<Popover position="bottom left" className="editor-post-visibility__dialog">
							<fieldset>
								<legend className="editor-post-visibility__dialog-legend">
									{ __( 'Post Visibility' ) }
								</legend>
								{ visibilityOptions.map( ( { value, label, info, onSelect, checked } ) => (
									<div key={ value } className="editor-post-visibility__choice">
										<input
											type="radio"
											name={ `editor-post-visibility__setting-${ instanceId }` }
											value={ value }
											onChange={ onSelect }
											checked={ checked }
											id={ `editor-post-${ value }-${ instanceId }` }
											aria-describedby={ `editor-post-${ value }-${ instanceId }-description` }
											className="editor-post-visibility__dialog-radio"
										/>
										<label
											htmlFor={ `editor-post-${ value }-${ instanceId }` }
											className="editor-post-visibility__dialog-label"
										>
											{ label }
										</label>
										{ <p id={ `editor-post-${ value }-${ instanceId }-description` } className="editor-post-visibility__dialog-info">{ info }</p> }
									</div>
								) ) }
							</fieldset>
							{ this.state.hasPassword &&
								<div className="editor-post-visibility__dialog-password">
									<label
										htmlFor={ `editor-post-visibility__dialog-password-input-${ instanceId }` }
										className="screen-reader-text"
									>
										{ __( 'Create password' ) }
									</label>
									<input
										className="editor-post-visibility__dialog-password-input"
										id={ `editor-post-visibility__dialog-password-input-${ instanceId }` }
										type="text"
										onChange={ updatePassword }
										value={ password }
										placeholder={ __( 'Use a secure password' ) }
									/>
								</div>
							}
						</Popover>
					}
				</span>
			</PanelRow>
		);
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
)( withInstanceId( clickOutside( PostVisibility ) ) );
