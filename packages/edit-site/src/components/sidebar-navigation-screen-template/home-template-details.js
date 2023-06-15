/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	__experimentalUseNavigator as useNavigator,
	Button,
	Icon,
	__experimentalTruncate as Truncate,
} from '@wordpress/components';
import { header, footer, layout, chevronRightSmall } from '@wordpress/icons';
import { useMemo } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
/**
 * Internal dependencies
 */
import {
	SidebarNavigationScreenDetailsPanel,
	SidebarNavigationScreenDetailsPanelRow,
	SidebarNavigationScreenDetailsPanelLabel,
	SidebarNavigationScreenDetailsPanelValue,
} from '../sidebar-navigation-screen-details-panel';
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import { useLink } from '../routes/link';

const EMPTY_OBJECT = {};

function TemplateAreaButton( { postId, icon, title } ) {
	const icons = {
		header,
		footer,
	};
	const linkInfo = useLink( {
		postType: 'wp_template_part',
		postId,
	} );

	return (
		<Button
			as="a"
			className="edit-site-sidebar-navigation-screen-template__template-area-button"
			{ ...linkInfo }
			icon={ icons[ icon ] ?? layout }
		>
			<Truncate
				limit={ 20 }
				ellipsizeMode="tail"
				numberOfLines={ 1 }
				className="edit-site-sidebar-navigation-screen-template__template-area-label-text"
			>
				{ decodeEntities( title ) }
			</Truncate>
			<span className="edit-site-sidebar-navigation-screen-template__template-icon">
				<Icon icon={ chevronRightSmall } />
			</span>
		</Button>
	);
}

export default function HomeTemplateDetails() {
	const navigator = useNavigator();
	const {
		params: { postType, postId },
	} = navigator;

	const {
		templatePartAreas,
		templateRecord,
		isHomePagePostsPage,
		themeName,
	} = useSelect(
		( select ) => {
			const {
				getEntityRecord,
				getEntityRecords,
				getCurrentTheme,
				getEditedEntityRecord,
			} = select( coreStore );
			const siteSettings = getEntityRecord( 'root', 'site' );
			const { getSettings } = unlock( select( editSiteStore ) );
			const siteEditorSettings = getSettings();
			const _templateRecord =
				getEditedEntityRecord( 'postType', postType, postId ) ||
				EMPTY_OBJECT;

			const currentTheme = getCurrentTheme();
			const templates = getEntityRecords( 'postType', postType, {
				per_page: -1,
			} );
			// The existence of a frontpage overrides home page as the front page template.
			const hasFrontPage =
				templates &&
				!! templates?.find( ( { slug } ) => slug === 'front-page' );

			return {
				themeName:
					currentTheme?.name?.rendered ||
					currentTheme?.name?.raw ||
					templateRecord?.theme,
				isHomePagePostsPage:
					! hasFrontPage && siteSettings?.show_on_front === 'posts',
				templateRecord: _templateRecord,
				templatePartAreas: siteEditorSettings?.defaultTemplatePartAreas,
			};
		},
		[ postType, postId ]
	);

	const templateAreas = useMemo( () => {
		return templateRecord?.blocks && templatePartAreas
			? templateRecord.blocks
					.filter( ( { name } ) => name === 'core/template-part' )
					.map( ( { attributes } ) => ( {
						...templatePartAreas?.find(
							( { area } ) => area === attributes?.tagName
						),
						...attributes,
					} ) )
			: [];
	}, [ templateRecord?.blocks, templatePartAreas ] );

	return (
		<>
			<SidebarNavigationScreenDetailsPanel title={ __( 'Details' ) }>
				{ isHomePagePostsPage && (
					<SidebarNavigationScreenDetailsPanelRow>
						{ __(
							'This template is currently set as your homepage'
						) }
					</SidebarNavigationScreenDetailsPanelRow>
				) }
				<SidebarNavigationScreenDetailsPanelRow>
					<SidebarNavigationScreenDetailsPanelLabel>
						{ __( 'Theme' ) }
					</SidebarNavigationScreenDetailsPanelLabel>
					<SidebarNavigationScreenDetailsPanelValue>
						{ decodeEntities( themeName ) }
					</SidebarNavigationScreenDetailsPanelValue>
				</SidebarNavigationScreenDetailsPanelRow>
				<SidebarNavigationScreenDetailsPanelRow>
					<SidebarNavigationScreenDetailsPanelLabel>
						{ __( 'Slug' ) }
					</SidebarNavigationScreenDetailsPanelLabel>
					<SidebarNavigationScreenDetailsPanelValue>
						{ decodeEntities( templateRecord?.slug ) }
					</SidebarNavigationScreenDetailsPanelValue>
				</SidebarNavigationScreenDetailsPanelRow>
			</SidebarNavigationScreenDetailsPanel>
			<SidebarNavigationScreenDetailsPanel title={ __( 'Areas' ) }>
				{ templateAreas.map( ( { label, icon, theme, slug } ) => (
					<SidebarNavigationScreenDetailsPanelRow key={ slug }>
						<TemplateAreaButton
							postId={ `${ theme }//${ slug }` }
							title={ label || slug }
							icon={ icon }
						/>
					</SidebarNavigationScreenDetailsPanelRow>
				) ) }
			</SidebarNavigationScreenDetailsPanel>
		</>
	);
}
