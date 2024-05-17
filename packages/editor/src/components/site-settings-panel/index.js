/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __experimentalVStack as VStack } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlogTitlePanel from './blog-title-panel';
import PostsPerPagePanel from './posts-per-page-panel';
import DiscussionPanel from './discussion-panel';
import { store as editorStore } from '../../store';

export default function SiteSettingsPanel() {
	const postSlug = useSelect(
		( select ) => select( editorStore ).getEditedPostAttribute( 'slug' ),
		[]
	);
	if ( ! [ 'home', 'index' ].includes( postSlug ) ) {
		return null;
	}
	return (
		<VStack spacing={ 1 } className="editor-site-settings-panel">
			<BlogTitlePanel />
			<PostsPerPagePanel />
			<DiscussionPanel />
		</VStack>
	);
}
