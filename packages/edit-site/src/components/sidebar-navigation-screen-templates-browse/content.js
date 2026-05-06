/**
 * WordPress dependencies
 */
import {
	store as coreStore,
	useEntityRecord,
	useEntityRecords,
} from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import SidebarNavigationItem from '../sidebar-navigation-item';
import { useAddedBy } from '../page-templates/hooks';
import { commentAuthorAvatar, published } from '@wordpress/icons';
import { unlock } from '../../lock-unlock';
import rootTemplateIcon from './root-template-icon';

const { useLocation } = unlock( routerPrivateApis );

const EMPTY_ARRAY = [];

function TemplateDataviewItem( { template, isActive } ) {
	const { text, icon } = useAddedBy( template.type, template.id );

	return (
		<SidebarNavigationItem
			to={ addQueryArgs( '/template', { activeView: text } ) }
			icon={ icon }
			aria-current={ isActive }
		>
			{ text }
		</SidebarNavigationItem>
	);
}

export default function DataviewsTemplatesSidebarContent() {
	const {
		params,
		query: { activeView = 'active' },
	} = useLocation();
	const { records } = useEntityRecords( 'root', 'registeredTemplate', {
		// This should not be needed, the endpoint returns all registered
		// templates, but it's not possible right now to turn off pagination for
		// entity configs.
		per_page: -1,
	} );
	const firstItemPerAuthorText = useMemo( () => {
		const firstItemPerAuthor = records?.reduce( ( acc, template ) => {
			const author = template.author_text;
			if ( author && ! acc[ author ] ) {
				acc[ author ] = template;
			}
			return acc;
		}, {} );
		return (
			( firstItemPerAuthor && Object.values( firstItemPerAuthor ) ) ??
			EMPTY_ARRAY
		);
	}, [ records ] );

	// If the active theme provides a `root.html`, surface a quick "Root
	// template" link inside the same ItemGroup as the per-source views so
	// it reads as a peer entry with consistent left-alignment. Promoted
	// out of the per-source views because it's the most common thing an
	// author of a root-template-based theme will want to edit.
	const stylesheet = useSelect(
		( select ) => select( coreStore ).getCurrentTheme()?.stylesheet,
		[]
	);
	const rootTemplateId = stylesheet ? `${ stylesheet }//root` : null;
	const { record: rootTemplate, hasResolved: hasResolvedRoot } =
		useEntityRecord( 'postType', 'wp_template', rootTemplateId ?? '', {
			enabled: !! rootTemplateId,
		} );
	const showRootEntry = hasResolvedRoot && !! rootTemplate;
	const isEditingRoot =
		params?.postId &&
		decodeURIComponent( params.postId ) === rootTemplateId;

	return (
		<ItemGroup className="edit-site-sidebar-navigation-screen-templates-browse">
			<SidebarNavigationItem
				to="/template"
				icon={ published }
				aria-current={ activeView === 'active' }
			>
				{ __( 'Active templates' ) }
			</SidebarNavigationItem>
			{ showRootEntry && (
				<SidebarNavigationItem
					to={ `/wp_template/${ rootTemplateId }?canvas=edit` }
					icon={ rootTemplateIcon }
					aria-current={ isEditingRoot }
				>
					{ __( 'Root template' ) }
				</SidebarNavigationItem>
			) }
			<SidebarNavigationItem
				to={ addQueryArgs( '/template', { activeView: 'user' } ) }
				icon={ commentAuthorAvatar }
				aria-current={ activeView === 'user' }
			>
				{
					// Let's avoid calling them "custom templates" to avoid
					// confusion. "Created" is closest to meaning database
					// templates, created by users.
					// https://developer.wordpress.org/themes/classic-themes/templates/page-template-files/#creating-custom-page-templates-for-global-use
					__( 'Created templates' )
				}
			</SidebarNavigationItem>
			{ firstItemPerAuthorText.map( ( template ) => {
				return (
					<TemplateDataviewItem
						key={ template.author_text }
						template={ template }
						isActive={ activeView === template.author_text }
					/>
				);
			} ) }
		</ItemGroup>
	);
}
