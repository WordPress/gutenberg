/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	CheckboxControl,
	__experimentalUseNavigator as useNavigator,
	Button,
	Icon,
} from '@wordpress/components';
import { header, footer, layout, chevronRightSmall } from '@wordpress/icons';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	SidebarNavigationScreenDetailsPanel,
	SidebarNavigationScreenDetailsPanelRow,
	SidebarNavigationScreenDetailsPanelLabel,
	SidebarNavigationScreenDetailsPanelValue,
} from '../sidebar-navigation-screen-details-panel';
import { unlock } from '../../private-apis';
import { store as editSiteStore } from '../../store';
import { useLink } from '../routes/link';

const EMPTY_OBJECT = {};

function TemplateAreaButton( { postId, icon, label } ) {
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
			icon={ icons[ icon ] ?? layout }
			{ ...linkInfo }
		>
			{ label }
			<Icon icon={ chevronRightSmall } />
		</Button>
	);
}

export default function HomeTemplateDetails() {
	const navigator = useNavigator();
	const {
		params: { postType, postId },
	} = navigator;

	const {
		commentOrder,
		templatePartAreas,
		isHomePageBlog,
		postsPerPage,
		siteTitle,
		templateRecord,
	} = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );
			const siteSettings = getEntityRecord( 'root', 'site' );
			const { getSettings } = unlock( select( editSiteStore ) );
			const siteEditorSettings = getSettings();
			const _templateRecord =
				select( coreStore ).getEditedEntityRecord(
					'postType',
					postType,
					postId
				) || EMPTY_OBJECT;

			return {
				templateRecord: _templateRecord,
				isHomePageBlog:
					siteSettings?.page_for_posts ===
					siteSettings?.page_on_front,
				siteTitle: siteSettings?.title,
				postsPerPage: siteSettings?.posts_per_page,
				commentOrder:
					siteEditorSettings?.__experimentalDiscussionSettings
						?.commentOrder,
				templatePartAreas: siteEditorSettings?.defaultTemplatePartAreas,
			};
		},
		[ postType, postId ]
	);

	const templateAreas = useMemo( () => {
		return templateRecord?.blocks && templatePartAreas
			? templateRecord.blocks
					.filter(
						( { name, attributes } ) =>
							name === 'core/template-part' &&
							( attributes?.slug === 'header' ||
								attributes?.slug === 'footer' )
					)
					.map( ( { attributes } ) => ( {
						...templatePartAreas?.find(
							( { area } ) => area === attributes?.slug
						),
						...attributes,
					} ) )
			: [];
	}, [ templateRecord?.blocks, templatePartAreas ] );

	const noop = () => {};

	return (
		<>
			<SidebarNavigationScreenDetailsPanel title={ __( 'Settings' ) }>
				{ isHomePageBlog && (
					<SidebarNavigationScreenDetailsPanelRow>
						<SidebarNavigationScreenDetailsPanelLabel>
							{ __( 'Posts per page' ) }
						</SidebarNavigationScreenDetailsPanelLabel>
						<SidebarNavigationScreenDetailsPanelValue>
							{ postsPerPage }
						</SidebarNavigationScreenDetailsPanelValue>
					</SidebarNavigationScreenDetailsPanelRow>
				) }
				<SidebarNavigationScreenDetailsPanelRow>
					<SidebarNavigationScreenDetailsPanelLabel>
						{ __( 'Blog title' ) }
					</SidebarNavigationScreenDetailsPanelLabel>
					<SidebarNavigationScreenDetailsPanelValue>
						{ siteTitle }
					</SidebarNavigationScreenDetailsPanelValue>
				</SidebarNavigationScreenDetailsPanelRow>
			</SidebarNavigationScreenDetailsPanel>

			<SidebarNavigationScreenDetailsPanel title={ __( 'Discussion' ) }>
				<SidebarNavigationScreenDetailsPanelRow>
					<CheckboxControl
						label="Allow comments on new posts"
						help="Individual posts may override these settings. Changes here will only be applied to new posts."
						checked={ true }
						onChange={ noop }
					/>
				</SidebarNavigationScreenDetailsPanelRow>
				<SidebarNavigationScreenDetailsPanelRow>
					<CheckboxControl
						label="Allow guest comments"
						help="Users do not have to be registered and logged in to comment."
						checked={ true }
						onChange={ noop }
					/>
				</SidebarNavigationScreenDetailsPanelRow>
				<SidebarNavigationScreenDetailsPanelRow>
					<SidebarNavigationScreenDetailsPanelLabel>
						{ __( 'Comment order' ) }
					</SidebarNavigationScreenDetailsPanelLabel>
					<SidebarNavigationScreenDetailsPanelValue>
						{ commentOrder }
					</SidebarNavigationScreenDetailsPanelValue>
				</SidebarNavigationScreenDetailsPanelRow>
			</SidebarNavigationScreenDetailsPanel>
			<SidebarNavigationScreenDetailsPanel title={ __( 'Areas' ) }>
				{ templateAreas.map( ( { label, icon, theme, slug } ) => (
					<SidebarNavigationScreenDetailsPanelRow key={ slug }>
						<SidebarNavigationScreenDetailsPanelLabel>
							{ label }
						</SidebarNavigationScreenDetailsPanelLabel>
						<SidebarNavigationScreenDetailsPanelValue>
							<TemplateAreaButton
								postId={ `${ theme }//${ slug }` }
								label={ label }
								icon={ icon }
							/>
						</SidebarNavigationScreenDetailsPanelValue>
					</SidebarNavigationScreenDetailsPanelRow>
				) ) }
			</SidebarNavigationScreenDetailsPanel>
		</>
	);
}
