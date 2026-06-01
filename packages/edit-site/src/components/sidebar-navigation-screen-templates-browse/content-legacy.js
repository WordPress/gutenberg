/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import {
	commentAuthorAvatar,
	layout,
	plugins as pluginIcon,
	globe,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { TEMPLATE_POST_TYPE } from '../../utils/constants';
import DataViewsSidebarContent from '../sidebar-dataviews';

const SOURCE_TO_ICON = {
	user: commentAuthorAvatar,
	theme: layout,
	plugin: pluginIcon,
	site: globe,
};
export default function DataviewsTemplatesSidebarContent() {
	const authorSourceMap = useSelect( ( select ) => {
		const templates = select( coreStore ).getEntityRecords(
			'postType',
			TEMPLATE_POST_TYPE,
			{ per_page: -1 }
		);
		if ( ! templates ) {
			return {};
		}
		const map = {};
		for ( const template of templates ) {
			if (
				template.author_text &&
				template.original_source &&
				! map[ template.author_text ]
			) {
				map[ template.author_text ] = template.original_source;
			}
		}
		return map;
	}, [] );

	const resolveIcon = ( view ) => {
		const source = authorSourceMap[ view.slug ];
		return SOURCE_TO_ICON[ source ] ?? layout;
	};

	return (
		<DataViewsSidebarContent
			postType={ TEMPLATE_POST_TYPE }
			resolveIcon={ resolveIcon }
		/>
	);
}
