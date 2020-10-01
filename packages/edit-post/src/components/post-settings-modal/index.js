/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PostStatus from './post-status';
import LastRevision from './last-revision';
import PostTaxonomies from './post-taxonomies';
import FeaturedImage from './featured-image';
import PostExcerpt from './post-excerpt';
import PostLink from './post-link';
import DiscussionPanel from './discussion-panel';
import PageAttributes from './page-attributes';
import MetaBoxes from '../meta-boxes';
import PluginDocumentSettingPanel from './plugin-document-setting-panel';

const MODAL_NAME = 'edit-post/post-settings';

export default function PostSettingsModal() {
	const { documentLabel, isModalActive } = useSelect( ( select ) => {
		const currentPostType = select( 'core/editor' ).getCurrentPostType();
		const postType = select( 'core' ).getPostType( currentPostType );

		return {
			isModalActive: select( 'core/edit-post' ).isModalActive(
				MODAL_NAME
			),
			documentLabel:
				// Disable reason: Post type labels object is shaped like this.
				// eslint-disable-next-line camelcase
				postType?.labels?.singular_name ??
				// translators: Default label for the Document sidebar tab, not selected.
				__( 'Document' ),
		};
	}, [] );

	const { closeModal } = useDispatch( 'core/edit-post' );

	if ( ! isModalActive ) {
		return null;
	}

	return (
		<Modal
			className="edit-post-post-settings-modal"
			title={ sprintf(
				/* translators: %s: singular document type. */
				__( '%s settings' ),
				documentLabel
			) }
			closeLabel={ __( 'Close' ) }
			onRequestClose={ closeModal }
		>
			<PostStatus />
			<PluginDocumentSettingPanel.Slot />
			<LastRevision />
			<PostLink />
			<PostTaxonomies />
			<FeaturedImage />
			<PostExcerpt />
			<DiscussionPanel />
			<PageAttributes />
			<MetaBoxes location="side" />
		</Modal>
	);
}
