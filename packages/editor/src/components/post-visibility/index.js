/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import {
	VisuallyHidden,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { withInstanceId, compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { visibilityOptions } from './utils';
import { store as editorStore } from '../../store';

function PublishPrivateConfirm( props ) {
	return props.showPrivateConfirmDialog ? (
		<ConfirmDialog
			onConfirm={ props.confirmPrivateHandler }
			onCancel={ props.cancelPrivateHandler }
		>
			{ __( 'Would you like to privately publish this post now?' ) }
		</ConfirmDialog>
	) : null;
}

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
		const { visibility, onUpdateVisibility, status } = this.props;

		onUpdateVisibility( visibility === 'private' ? 'draft' : status );
		this.setState( { hasPassword: false } );
	}

	setPrivate() {
		this.setState( { showPrivateConfirmDialog: true } );
	}

	confirmPrivateHandler = () => {
		const { onUpdateVisibility, onSave } = this.props;

		onUpdateVisibility( 'private' );
		this.setState( { hasPassword: false } );
		onSave();
	};

	cancelPrivateHandler = () => {
		this.setState( { showPrivateConfirmDialog: false } );
	};

	setPasswordProtected() {
		const { visibility, onUpdateVisibility, status, password } = this.props;

		onUpdateVisibility(
			visibility === 'private' ? 'draft' : status,
			password || ''
		);
		this.setState( { hasPassword: true } );
	}

	updatePassword( event ) {
		const { status, onUpdateVisibility } = this.props;
		onUpdateVisibility( status, event.target.value );
	}

	render() {
		const { visibility, password, instanceId } = this.props;

		const visibilityHandlers = {
			public: {
				onSelect: this.setPublic,
				checked: visibility === 'public' && ! this.state.hasPassword,
			},
			private: {
				onSelect: this.setPrivate,
				checked: visibility === 'private',
			},
			password: {
				onSelect: this.setPasswordProtected,
				checked: this.state.hasPassword,
			},
		};

		return [
			<fieldset
				key="visibility-selector"
				className="editor-post-visibility__dialog-fieldset"
			>
				<legend className="editor-post-visibility__dialog-legend">
					{ __( 'Post Visibility' ) }
				</legend>
				{ visibilityOptions.map( ( { value, label, info } ) => (
					<div
						key={ value }
						className="editor-post-visibility__choice"
					>
						<input
							type="radio"
							name={ `editor-post-visibility__setting-${ instanceId }` }
							value={ value }
							onChange={ visibilityHandlers[ value ].onSelect }
							checked={ visibilityHandlers[ value ].checked }
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
						{
							<p
								id={ `editor-post-${ value }-${ instanceId }-description` }
								className="editor-post-visibility__dialog-info"
							>
								{ info }
							</p>
						}
					</div>
				) ) }
			</fieldset>,
			this.state.hasPassword && (
				<div
					className="editor-post-visibility__dialog-password"
					key="password-selector"
				>
					<VisuallyHidden
						as="label"
						htmlFor={ `editor-post-visibility__dialog-password-input-${ instanceId }` }
					>
						{ __( 'Create password' ) }
					</VisuallyHidden>
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
			<PublishPrivateConfirm
				key={ 'private-publish-confirmation' }
				showPrivateConfirmDialog={ this.state.showPrivateConfirmDialog }
				confirmPrivateHandler={ this.confirmPrivateHandler }
				cancelPrivateHandler={ this.cancelPrivateHandler }
			>
				{ __( 'Would you like to privately publish this post now?' ) }
			</PublishPrivateConfirm>,
		];
	}
}

export default compose( [
	withSelect( ( select ) => {
		const { getEditedPostAttribute, getEditedPostVisibility } = select(
			editorStore
		);
		return {
			status: getEditedPostAttribute( 'status' ),
			visibility: getEditedPostVisibility(),
			password: getEditedPostAttribute( 'password' ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { savePost, editPost } = dispatch( editorStore );
		return {
			onSave: savePost,
			onUpdateVisibility( status, password = '' ) {
				editPost( { status, password } );
			},
		};
	} ),
	withInstanceId,
] )( PostVisibility );
