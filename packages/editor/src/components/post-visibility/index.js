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
		this.setCustomVisibility = this.setCustomVisibility.bind( this );

		this.state = {
			hasPassword: !! props.password,
			currentVisibility: props.postVisibility,
		};
	}

	setPublic() {
		const { postVisibility, onUpdateVisibility } = this.props;

		onUpdateVisibility( postVisibility === 'private' ? 'draft' : 'publish' );
		this.setState( { currentVisibility: 'public', hasPassword: false } );
	}

	setPrivate() {
		if ( ! window.confirm( __( 'Would you like to privately publish this post now?' ) ) ) { // eslint-disable-line no-alert
			return;
		}

		const { onUpdateVisibility, onSave } = this.props;

		onUpdateVisibility( 'private' );
		this.setState( { currentVisibility: 'private', hasPassword: false } );
		onSave();
	}

	setPasswordProtected() {
		const { postVisibility, onUpdateVisibility, password } = this.props;

		onUpdateVisibility( postVisibility === 'private' ? 'draft' : 'publish', password || '' );
		this.setState( { currentVisibility: 'password', hasPassword: true } );
	}

	updatePassword( event ) {
		const { status, onUpdateVisibility } = this.props;
		onUpdateVisibility( status, event.target.value );
	}

	setCustomVisibility( event ) {
		const { onUpdateVisibility } = this.props;

		if ( event.target.value !== this.state.currentVisibility ) {
			onUpdateVisibility( event.target.value );
			this.setState( { currentVisibility: event.target.value, hasPassword: false } );
		}
	}

	isChecked( statusVisibility ) {
		return this.state.currentVisibility === statusVisibility;
	}

	render() {
		const { password, statuses, instanceId } = this.props;
		const statusVisibilities = filter( statuses, ( status ) => status.visibility.value );

		const visibilityHandlers = {
			public: {
				onSelect: this.setPublic,
				checked: this.state.currentVisibility === 'public' && ! this.state.hasPassword,
			},
			private: {
				onSelect: this.setPrivate,
				checked: this.state.currentVisibility === 'private',
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
							onChange={ visibilityHandlers[ visibility.value ] ? visibilityHandlers[ visibility.value ].onSelect : this.setCustomVisibility }
							checked={ visibilityHandlers[ visibility.value ] ? visibilityHandlers[ visibility.value ].checked : this.isChecked( visibility.value ) }
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
