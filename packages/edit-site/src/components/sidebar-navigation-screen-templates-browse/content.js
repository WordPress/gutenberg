/**
 * WordPress dependencies
 */
import { useEntityRecords } from '@wordpress/core-data';
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
import { layout } from '@wordpress/icons';
import { unlock } from '../../lock-unlock';

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
		query: { activeView = 'active' },
	} = useLocation();
	const { records } = useEntityRecords(
		'postType',
		'wp_registered_template',
		{
			per_page: -1,
		}
	);
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

	return (
		<ItemGroup className="edit-site-sidebar-navigation-screen-templates-browse">
			<SidebarNavigationItem
				to="/template"
				icon={ layout }
				aria-current={ activeView === 'active' }
			>
				{ __( 'Active templates' ) }
			</SidebarNavigationItem>
			<SidebarNavigationItem
				to={ addQueryArgs( '/template', { activeView: 'user' } ) }
				icon={ layout }
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
