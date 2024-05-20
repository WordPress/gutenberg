/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __experimentalVStack as VStack } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlogTitle from '../blog-title';
import PostsPerPage from '../posts-per-page';
import SiteDiscussion from '../site-discussion';
import { store as editorStore } from '../../store';
import { TEMPLATE_POST_TYPE } from '../../store/constants';

export default function SiteSettingsPanel() {
	const { isTemplate, postSlug } = useSelect( ( select ) => {
		const { getEditedPostAttribute, getCurrentPostType } =
			select( editorStore );
		return {
			isTemplate: getCurrentPostType() === TEMPLATE_POST_TYPE,
			postSlug: getEditedPostAttribute( 'slug' ),
		};
	}, [] );
	if ( ! isTemplate || ! [ 'home', 'index' ].includes( postSlug ) ) {
		return null;
	}
	return (
		<VStack spacing={ 1 } className="editor-site-settings-panel">
			<BlogTitle />
			<PostsPerPage />
			<SiteDiscussion />
		</VStack>
	);
}
