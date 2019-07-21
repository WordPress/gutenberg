/**
 * External dependencies
 */
import { filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { withInstanceId, compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';

export class PostVisibility extends Component {
	constructor( props ) {
		super( ...arguments );

		this.setPublic = this.setPublic.bind( this );
		this.setPrivate = this.setPrivate.bind( this );
		this.setPasswordProtected = this.setPasswordProtected.bind( this );
		this.updatePassword = this.updatePassword.bind( this );

		this.state = {
			hasPassword: !! props.password,
		};
	}

	setPublic() {
		const { postVisibility, onUpdateVisibility, status } = this.props;

		onUpdateVisibility( postVisibility === 'private' ? 'draft' : status );
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
		const { postVisibility, onUpdateVisibility, status, password } = this.props;

		onUpdateVisibility( postVisibility === 'private' ? 'draft' : status, password || '' );
		this.setState( { hasPassword: true } );
	}

	updatePassword( event ) {
		const { status, onUpdateVisibility } = this.props;
		onUpdateVisibility( status, event.target.value );
	}

	render() {
		const { postVisibility, password, statuses, instanceId } = this.props;
		const statusVisibilities = filter( statuses, ( status ) => status.visibility.value );

		const visibilityHandlers = {
			public: {
				onSelect: this.setPublic,
				checked: postVisibility === 'public' && ! this.state.hasPassword,
			},
			private: {
				onSelect: this.setPrivate,
				checked: postVisibility === 'private',
			},
			password: {
				onSelect: this.setPasswordProtected,
				checked: this.state.hasPassword,
			},
		};

		return [
			<fieldset key="visibility-selector" className="editor-post-visibility__dialog-fieldset">
				<legend className="editor-post-visibility__dialog-legend">
					{ __( 'Post Visibility' ) }
				</legend>
				{ statusVisibilities.map( ( { visibility } ) => (
					<div key={ visibility.value } className="editor-post-visibility__choice">
						<input
							type="radio"
							name={ `editor-post-visibility__setting-${ instanceId }` }
							value={ visibility.value }
							onChange={ visibilityHandlers[ visibility.value ].onSelect }
							checked={ visibilityHandlers[ visibility.value ].checked }
							id={ `editor-post-${ visibility.value }-${ instanceId }` }
							aria-describedby={ `editor-post-${ visibility.value }-${ instanceId }-description` }
							className="editor-post-visibility__dialog-radio"
						/>
						<label
							htmlFor={ `editor-post-${ visibility.value }-${ instanceId }` }
							className="editor-post-visibility__dialog-label"
						>
							{ visibility.label }
						</label>
						{ <p id={ `editor-post-${ visibility.value }-${ instanceId }-description` } className="editor-post-visibility__dialog-info">{ visibility.info }</p> }
					</div>
				) ) }
			</fieldset>,
			this.state.hasPassword && (
				<div className="editor-post-visibility__dialog-password" key="password-selector">
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
						onChange={ this.updatePassword }
						value={ password }
						placeholder={ __( 'Use a secure password' ) }
					/>
				</div>
			),
		];
	}
}

export default compose( [
	withSelect( ( select ) => {
		const {
			getEditedPostAttribute,
			getEditedPostVisibility,
		} = select( 'core/editor' );
		return {
			status: getEditedPostAttribute( 'status' ),
			postVisibility: getEditedPostVisibility(),
			password: getEditedPostAttribute( 'password' ),
			statuses: select( 'core' ).getStatuses(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { savePost, editPost } = dispatch( 'core/editor' );
		return {
			onSave: savePost,
			onUpdateVisibility( status, password = null ) {
				editPost( { status, password } );
			},
		};
	} ),
	withInstanceId,
] )( PostVisibility );
