/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Component } from 'element';
import { Button } from 'components';

/**
 * Internal dependencies
 */
import {
	editPost,
	savePost,
	successNotice,
	errorNotice,
} from '../../actions';
import {
	isSavingPost,
	isEditedPostPublished,
	isEditedPostBeingScheduled,
	getEditedPostVisibility,
	isEditedPostSaveable,
	isEditedPostPublishable,
	getCurrentPost,
	didPostSaveRequestSucceed,
} from '../../selectors';

class PublishButton extends Component {
	constructor() {
		super( ...arguments );
		this.onClick = this.onClick.bind( this );
	}

	componentDidUpdate( prevProps ) {
		if ( prevProps.isSaving && ! this.props.isSaving && this.props.didSaveSuccessfully ) {
			this.props.successNotice( (
				<p>
					<span>{ __( 'Post saved!' ) }</span>
					{ ' ' }
					<a href={ this.props.post.link } target="_blank">{ __( 'View post' ) }</a>
				</p>
			) );
		}

		if ( prevProps.isSaving && ! this.props.isSaving && ! this.props.didSaveSuccessfully ) {
			this.props.errorNotice( __( 'Saving failed' ) );
		}
	}

	onClick() {
		const { isPublished, isBeingScheduled, visibility, onSave, onStatusChange } = this.props;
		let publishStatus = 'publish';
		if ( isBeingScheduled ) {
			publishStatus = 'future';
		} else if ( visibility === 'private' ) {
			publishStatus = 'private';
		}
		const doSave = isPublished ||
			! process.env.NODE_ENV === 'production' ||
			window.confirm( // eslint-disable-line no-alert
				__( 'Keep in mind this plugin is a beta version and will not display correctly on your theme.' )
			);
		if ( doSave ) {
			onStatusChange( publishStatus );
			onSave();
		}
	}

	render() {
		const {
			isSaving,
			isPublished,
			isBeingScheduled,
			isPublishable,
			isSaveable,
		} = this.props;

		const buttonEnabled = ! isSaving && isPublishable && isSaveable;
		let buttonText;
		if ( isPublished ) {
			buttonText = __( 'Update' );
		} else if ( isBeingScheduled ) {
			buttonText = __( 'Schedule' );
		} else {
			buttonText = __( 'Publish' );
		}
		const className = classnames( 'editor-tools__publish-button', { 'is-saving': isSaving } );

		return (
			<Button
				isPrimary
				isLarge
				onClick={ this.onClick }
				disabled={ ! buttonEnabled }
				className={ className }
			>
				{ buttonText }
			</Button>
		);
	}
}

export default connect(
	( state ) => ( {
		isSaving: isSavingPost( state ),
		didSaveSuccessfully: didPostSaveRequestSucceed( state ),
		isPublished: isEditedPostPublished( state ),
		isBeingScheduled: isEditedPostBeingScheduled( state ),
		visibility: getEditedPostVisibility( state ),
		isSaveable: isEditedPostSaveable( state ),
		isPublishable: isEditedPostPublishable( state ),
		post: getCurrentPost( state ),
	} ),
	{
		onStatusChange: ( status ) => editPost( { status } ),
		onSave: savePost,
		successNotice,
		errorNotice,
	}
)( PublishButton );
