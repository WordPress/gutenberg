/**
 * WordPress dependencies
 */
import { __, sprintf, _x } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { Icon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useAddedBy } from '../list/added-by';
import useEditedEntityRecord from '../use-edited-entity-record';
import useNavigationMenuContent from './use-navigation-menu-content';
import SidebarNavigationScreenDetailsFooter from '../sidebar-navigation-screen-details-footer';
import {
	SidebarNavigationScreenDetailsPanel,
	SidebarNavigationScreenDetailsPanelRow,
	SidebarNavigationScreenDetailsPanelLabel,
	SidebarNavigationScreenDetailsPanelValue,
} from '../sidebar-navigation-screen-details-panel';

export default function usePatternDetails( postType, postId ) {
	const { getDescription, getTitle, record } = useEditedEntityRecord(
		postType,
		postId
	);
	const currentTheme = useSelect(
		( select ) => select( coreStore ).getCurrentTheme(),
		[]
	);
	const addedBy = useAddedBy( postType, postId );
	const isAddedByActiveTheme =
		addedBy.type === 'theme' && record.theme === currentTheme?.stylesheet;
	const title = getTitle();
	let descriptionText = getDescription();

	if ( ! descriptionText && addedBy.text ) {
		descriptionText = sprintf(
			// translators: %s: pattern title e.g: "Header".
			__( 'This is your %s pattern.' ),
			getTitle()
		);
	}

	if ( ! descriptionText && postType === 'wp_block' && record?.title ) {
		descriptionText = sprintf(
			// translators: %s: user created pattern title e.g. "Footer".
			__( 'This is your %s pattern.' ),
			record.title
		);
	}

	const description = (
		<>
			{ descriptionText }

			{ addedBy.text && ! isAddedByActiveTheme && (
				<span className="edit-site-sidebar-navigation-screen-pattern__added-by-description">
					<span className="edit-site-sidebar-navigation-screen-pattern__added-by-description-author">
						<span className="edit-site-sidebar-navigation-screen-pattern__added-by-description-author-icon">
							{ addedBy.imageUrl ? (
								<img
									src={ addedBy.imageUrl }
									alt=""
									width="24"
									height="24"
								/>
							) : (
								<Icon icon={ addedBy.icon } />
							) }
						</span>
						{ addedBy.text }
					</span>

					{ addedBy.isCustomized && (
						<span className="edit-site-sidebar-navigation-screen-pattern__added-by-description-customized">
							{ _x( '(Customized)', 'pattern' ) }
						</span>
					) }
				</span>
			) }
		</>
	);

	const footer = !! record?.modified ? (
		<SidebarNavigationScreenDetailsFooter
			lastModifiedDateTime={ record.modified }
		/>
	) : null;

	const details = [];

	if ( postType === 'wp_block' ) {
		details.push( {
			label: __( 'Syncing' ),
			value:
				record.meta?.sync_status === 'unsynced'
					? __( 'Not synced' )
					: __( 'Fully synced' ),
		} );
	}

	const content = (
		<>
			{ !! details.length && (
				<SidebarNavigationScreenDetailsPanel
					spacing={ 5 }
					title={ __( 'Details' ) }
				>
					{ details.map( ( { label, value } ) => (
						<SidebarNavigationScreenDetailsPanelRow key={ label }>
							<SidebarNavigationScreenDetailsPanelLabel>
								{ label }
							</SidebarNavigationScreenDetailsPanelLabel>
							<SidebarNavigationScreenDetailsPanelValue>
								{ value }
							</SidebarNavigationScreenDetailsPanelValue>
						</SidebarNavigationScreenDetailsPanelRow>
					) ) }
				</SidebarNavigationScreenDetailsPanel>
			) }
			{ useNavigationMenuContent( postType, postId ) }
		</>
	);

	return { title, description, content, footer };
}
