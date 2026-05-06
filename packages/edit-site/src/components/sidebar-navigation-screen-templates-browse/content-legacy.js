/**
 * WordPress dependencies
 */
import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { privateApis as routerPrivateApis } from '@wordpress/router';
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
import SidebarNavigationItem from '../sidebar-navigation-item';
import { unlock } from '../../lock-unlock';
import rootTemplateIcon from './root-template-icon';

const { useLocation } = unlock( routerPrivateApis );

const SOURCE_TO_ICON = {
	user: commentAuthorAvatar,
	theme: layout,
	plugin: pluginIcon,
	site: globe,
};

export default function DataviewsTemplatesSidebarContent() {
	const { params } = useLocation();
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

	// If the active theme provides a `root.html`, append a "Root template"
	// link inside the same ItemGroup as the per-source views, so it reads
	// as a peer entry with consistent left-alignment. `useEntityRecord`
	// (vs. `useSelect`) so the lookup is auto-fetched and we know when it
	// has resolved.
	const stylesheet = useSelect(
		( select ) => select( coreStore ).getCurrentTheme()?.stylesheet,
		[]
	);
	const rootTemplateId = stylesheet ? `${ stylesheet }//root` : null;
	const { record: rootTemplate, hasResolved: hasResolvedRoot } =
		useEntityRecord( 'postType', TEMPLATE_POST_TYPE, rootTemplateId ?? '', {
			enabled: !! rootTemplateId,
		} );
	const showRootEntry = hasResolvedRoot && !! rootTemplate;
	const isEditingRoot =
		params?.postId &&
		decodeURIComponent( params.postId ) === rootTemplateId;

	const appendItems = showRootEntry ? (
		<SidebarNavigationItem
			to={ `/wp_template/${ rootTemplateId }?canvas=edit` }
			icon={ rootTemplateIcon }
			aria-current={ isEditingRoot }
		>
			{ __( 'Root template' ) }
		</SidebarNavigationItem>
	) : null;

	return (
		<DataViewsSidebarContent
			postType={ TEMPLATE_POST_TYPE }
			resolveIcon={ resolveIcon }
			appendItems={ appendItems }
		/>
	);
}
