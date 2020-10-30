/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import {
	__experimentalRadio as Radio,
	TextControl,
} from '@wordpress/components';
import { ContextSystemProvider } from '@wordpress/ui.context';
import { ListGroup, Grid, View, Text } from '@wordpress/ui.components';
import { withInstanceId, compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { visibilityOptions } from './utils';

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
		if (
			// eslint-disable-next-line no-alert
			! window.confirm(
				__( 'Would you like to privately publish this post now?' )
			)
		) {
			return;
		}

		const { onUpdateVisibility, onSave } = this.props;

		onUpdateVisibility( 'private' );
		this.setState( { hasPassword: false } );
		onSave();
	}

	setPasswordProtected() {
		const { visibility, onUpdateVisibility, status, password } = this.props;

		onUpdateVisibility(
			visibility === 'private' ? 'draft' : status,
			password || ''
		);
		this.setState( { hasPassword: true } );
	}

	updatePassword( next ) {
		const { status, onUpdateVisibility } = this.props;
		onUpdateVisibility( status, next );
	}

	render() {
		const { visibility, password } = this.props;

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
				<ContextSystemProvider
					value={ { ControlLabel: { weight: 'bold' } } }
				>
					<ListGroup>
						{ visibilityOptions.map( ( { value, label, info } ) => (
							<div
								key={ value }
								className="editor-post-visibility__choice"
							>
								<Radio
									label={ label }
									help={ <Text>{ info }</Text> }
									value={ value }
									onChange={
										visibilityHandlers[ value ].onSelect
									}
									checked={
										visibilityHandlers[ value ].checked
									}
									version="next"
								/>
							</div>
						) ) }
					</ListGroup>
				</ContextSystemProvider>
			</fieldset>,
			this.state.hasPassword && (
				<Grid templateColumns="20px 1fr" css={ { paddingTop: 4 } }>
					<View />
					<TextControl
						className="editor-post-visibility__dialog-password"
						key="password-selector"
						label={ __( 'Create password' ) }
						labelHidden
						onChange={ this.updatePassword }
						value={ password }
						placeholder={ __( 'Use a secure password' ) }
						version="next"
					/>
				</Grid>
			),
		];
	}
}

export default compose( [
	withSelect( ( select ) => {
		const { getEditedPostAttribute, getEditedPostVisibility } = select(
			'core/editor'
		);
		return {
			status: getEditedPostAttribute( 'status' ),
			visibility: getEditedPostVisibility(),
			password: getEditedPostAttribute( 'password' ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { savePost, editPost } = dispatch( 'core/editor' );
		return {
			onSave: savePost,
			onUpdateVisibility( status, password = '' ) {
				editPost( { status, password } );
			},
		};
	} ),
	withInstanceId,
] )( PostVisibility );
