/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { compose, Component } from '@wordpress/element';
import { withAPIData, IconButton, Spinner } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import PostPublishButton from '../post-publish-button';
import PostPublishPanelPrepublish from './prepublish';
import PostPublishPanelPostpublish from './postpublish';
import { getCurrentPostType, isCurrentPostPublished, isSavingPost } from '../../store/selectors';

class PostPublishPanel extends Component {
	constructor() {
		super( ...arguments );
		this.onPublish = this.onPublish.bind( this );
		this.state = {
			loading: false,
			published: false,
		};
	}

	componentWillReceiveProps( newProps ) {
		if (
			newProps.isPublished &&
			! this.state.published &&
			! newProps.isSaving
		) {
			this.setState( {
				published: true,
				loading: false,
			} );
		}
	}

	onPublish() {
		this.setState( { loading: true } );
	}

	render() {
		const { onClose, user } = this.props;
		const { loading, published } = this.state;
		const canPublish = get( user.data, [ 'post_type_capabilities', 'publish_posts' ], false );

		return (
			<div className="editor-post-publish-panel">
				<div className="editor-post-publish-panel__header">
					{ ! published && (
						<div className="editor-post-publish-panel__header-publish-button">
							<PostPublishButton onSubmit={ this.onPublish } />
						</div>
					) }
					{ published && (
						<div className="editor-post-publish-panel__header-published">{ __( 'Published' ) }</div>
					) }
					<IconButton
						onClick={ onClose }
						icon="no-alt"
						label={ __( 'Close Publish Panel' ) }
					/>
				</div>
				<div className="editor-post-publish-panel__content">
					{ canPublish && ! loading && ! published && <PostPublishPanelPrepublish /> }
					{ loading && ! published && <Spinner /> }
					{ published && <PostPublishPanelPostpublish /> }
				</div>
			</div>
		);
	}
}

const applyConnect = connect(
	( state ) => {
		return {
			postType: getCurrentPostType( state ),
			isPublished: isCurrentPostPublished( state ),
			isSaving: isSavingPost( state ),
		};
	},
);

const applyWithAPIData = withAPIData( ( props ) => {
	const { postType } = props;

	return {
		user: `/wp/v2/users/me?post_type=${ postType }&context=edit`,
	};
} );

export default compose( [
	applyConnect,
	applyWithAPIData,
] )( PostPublishPanel );
