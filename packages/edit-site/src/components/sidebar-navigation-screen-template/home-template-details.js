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
import { store as blockEditorStore } from '@wordpress/block-editor';
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
import useEditedEntityRecord from '../use-edited-entity-record';

function TemplateAreaButton( { icon, label } ) {
	const icons = {
		header,
		footer,
	};
	return (
		<Button
			as="a"
			className="edit-site-sidebar-navigation-screen-template__template-area-button"
			icon={ icons[ icon ] ?? layout }
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
	const { record } = useEditedEntityRecord( postType, postId );
	const {
		commentOrder,
		templatePartAreas,
		isHomePageBlog,
		postsPerPage,
		siteTitle,
	} = useSelect( ( select ) => {
		const { getEntityRecord } = select( coreStore );
		const siteSettings = getEntityRecord( 'root', 'site' );
		const { getSettings } = select( blockEditorStore );
		const blockEditorSettings = getSettings();

		return {
			isHomePageBlog:
				siteSettings?.page_for_posts === siteSettings?.page_on_front,
			siteTitle: siteSettings?.title,
			postsPerPage: +siteSettings?.posts_per_page,
			commentOrder:
				blockEditorSettings?.__experimentalDiscussionSettings
					?.commentOrder,
			templatePartAreas: blockEditorSettings?.defaultTemplatePartAreas,
		};
	}, [] );

	const templateAreas = useMemo( () => {
		return record?.blocks && templatePartAreas
			? record.blocks
					.filter(
						( { name, attributes } ) =>
							name === 'core/template-part' &&
							( attributes?.slug === 'header' ||
								attributes?.slug === 'footer' )
					)
					.map( ( { attributes } ) =>
						templatePartAreas?.find(
							( { area } ) => area === attributes?.slug
						)
					)
			: [];
	}, [ record?.blocks, templatePartAreas ] );

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
				{ templateAreas.map( ( { area, label, icon } ) => (
					<SidebarNavigationScreenDetailsPanelRow key={ area }>
						<SidebarNavigationScreenDetailsPanelLabel>
							{ label }
						</SidebarNavigationScreenDetailsPanelLabel>
						<SidebarNavigationScreenDetailsPanelValue>
							<TemplateAreaButton label={ label } icon={ icon } />
						</SidebarNavigationScreenDetailsPanelValue>
					</SidebarNavigationScreenDetailsPanelRow>
				) ) }
			</SidebarNavigationScreenDetailsPanel>
		</>
	);
}
