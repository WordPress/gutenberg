/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { CheckboxControl } from '@wordpress/components';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import {
	SidebarNavigationScreenDetailsPanel,
	SidebarNavigationScreenDetailsPanelRow,
	SidebarNavigationScreenDetailsPanelLabel,
	SidebarNavigationScreenDetailsPanelValue,
} from '../sidebar-navigation-screen-details-panel';

export default function HomeTemplateDetails() {
	const { commentOrder, isHomePageBlog, postsPerPage, siteTitle } = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );
			const siteSettings = getEntityRecord( 'root', 'site' );
			const { getSettings } = select( blockEditorStore );

			return {
				isHomePageBlog:
					siteSettings?.page_for_posts ===
					siteSettings?.page_on_front,
				siteTitle: siteSettings?.title,
				postsPerPage: siteSettings?.posts_per_page,
				commentOrder:
					getSettings()?.__experimentalDiscussionSettings
						?.commentOrder,
			};
		},
		[]
	);

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
				Test
			</SidebarNavigationScreenDetailsPanel>
		</>
	);
}
