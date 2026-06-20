/**
 * WordPress dependencies
 */
import { __experimentalItemGroup as ItemGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	media,
	image,
	audio,
	video,
	file,
	table,
	archive,
} from '@wordpress/icons';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import SidebarNavigationItem from '../sidebar-navigation-item';
import { unlock } from '../../lock-unlock';

const { useLocation, useHistory } = unlock( routerPrivateApis );

const FILE_TYPES = [
	{ slug: 'image', label: __( 'Images' ), icon: image },
	{ slug: 'audio', label: __( 'Audio' ), icon: audio },
	{ slug: 'video', label: __( 'Video' ), icon: video },
	{ slug: 'application', label: __( 'Documents' ), icon: file },
	{ slug: 'text', label: __( 'Spreadsheets' ), icon: table },
	{ slug: 'archive', label: __( 'Archives' ), icon: archive },
];

function SidebarSection( { title, children } ) {
	return (
		<div className="edit-site-sidebar-media-library__section">
			<h3 className="edit-site-sidebar-media-library__section-title">
				{ title }
			</h3>
			{ children }
		</div>
	);
}

export default function MediaSidebarContent() {
	const { path, query } = useLocation();
	const history = useHistory();
	const currentFilter = query.sidebarFilter || 'all';

	const counts = useSelect( ( select ) => {
		const { getEntityRecordsTotalItems } = select( coreStore );
		const results = {};
		for ( const ft of FILE_TYPES ) {
			results[ ft.slug ] = getEntityRecordsTotalItems(
				'postType',
				'attachment',
				{
					status: 'inherit',
					media_type: ft.slug,
					per_page: 1,
				}
			);
		}
		return results;
	}, [] );

	function navigateWithFilter( filter ) {
		history.navigate(
			addQueryArgs( path, {
				...query,
				sidebarFilter: filter,
				pageNumber: undefined,
			} )
		);
	}

	return (
		<div className="edit-site-sidebar-media-library">
			<ItemGroup>
				<SidebarNavigationItem
					icon={ media }
					aria-current={
						currentFilter === 'all' ? 'true' : undefined
					}
					onClick={ () => navigateWithFilter( 'all' ) }
				>
					{ __( 'All Media' ) }
				</SidebarNavigationItem>
				<SidebarNavigationItem
					icon={ media }
					aria-current={
						currentFilter === 'my-files' ? 'true' : undefined
					}
					onClick={ () => navigateWithFilter( 'my-files' ) }
				>
					{ __( 'My Files' ) }
				</SidebarNavigationItem>
			</ItemGroup>

			<SidebarSection title={ __( 'File Types' ) }>
				<ItemGroup>
					{ FILE_TYPES.map( ( ft ) => (
						<SidebarNavigationItem
							key={ ft.slug }
							icon={ ft.icon }
							aria-current={
								currentFilter === ft.slug ? 'true' : undefined
							}
							onClick={ () => navigateWithFilter( ft.slug ) }
							suffix={
								counts[ ft.slug ] !== undefined ? (
									<span className="edit-site-sidebar-media-library__count">
										{ counts[ ft.slug ] }
									</span>
								) : undefined
							}
						>
							{ ft.label }
						</SidebarNavigationItem>
					) ) }
				</ItemGroup>
			</SidebarSection>
		</div>
	);
}
