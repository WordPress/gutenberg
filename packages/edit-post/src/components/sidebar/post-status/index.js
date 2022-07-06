/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
	DropdownMenu,
	MenuGroup,
	MenuItem,
	__experimentalGrid as Grid,
} from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { compose, ifCondition } from '@wordpress/compose';
import { moreVertical, check, trash } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import PostVisibility from '../post-visibility';
import PostTrash from '../post-trash';
import PostSchedule from '../post-schedule';
import PostSticky from '../post-sticky';
import PostAuthor from '../post-author';
import PostSlug from '../post-slug';
import PostFormat from '../post-format';
import PostPendingStatus from '../post-pending-status';
import PluginPostStatusInfo from '../plugin-post-status-info';
import { store as editPostStore } from '../../../store';
import PostTemplate from '../post-template';
import PostURL from '../post-url';

/**
 * Module Constants
 */
const PANEL_NAME = 'post-status';

// todo: should we rename this to PostSummary? (incl. css classes) - it might break BC.
function PostStatus() {
	return (
		<VStack className="edit-post-post-status" spacing={ 4 }>
			<PluginPostStatusInfo.Slot>
				{ ( fills ) => (
					<>
						<PostStatusHeader />
						<Grid
							columns={ 2 }
							templateColumns="fit-content(40%) 1fr"
							align="center"
						>
							<PostVisibility />
							<PostSchedule />
							<PostURL />
							<PostTemplate />
						</Grid>
						<PostSticky />
						<PostPendingStatus />
						<PostFormat />
						<PostSlug />
						<PostAuthor />
						{ fills }
						<PostTrash />
					</>
				) }
			</PluginPostStatusInfo.Slot>
		</VStack>
	);
}

// todo: move to new file
function PostStatusHeader() {
	return (
		<HStack className="edit-post-post-status__header">
			<Heading className="edit-post-post-status__heading" level={ 2 }>
				{ __( 'Summary' ) }
			</Heading>
			<DropdownMenu
				icon={ moreVertical }
				label={ __( 'Options' ) }
				toggleProps={ { isSmall: true } }
			>
				{ () => (
					<>
						<MenuGroup>
							<MenuItem
								icon={ check }
								isSelected
								role="menuitemcheckbox"
							>
								{ __( 'Stick to the top' ) }
							</MenuItem>
							<MenuItem
								icon={ check }
								isSelected
								role="menuitemcheckbox"
							>
								{ __( 'Mark as pending' ) }
							</MenuItem>
							<MenuItem>{ __( 'Revision history' ) }</MenuItem>
						</MenuGroup>
						<MenuGroup>
							<MenuItem icon={ trash } isDestructive>
								{ __( 'Move to trash' ) }
							</MenuItem>
						</MenuGroup>
					</>
				) }
			</DropdownMenu>
		</HStack>
	);
}

export default compose( [
	withSelect( ( select ) => {
		// We use isEditorPanelRemoved to hide the panel if it was programatically removed. We do
		// not use isEditorPanelEnabled since this panel should not be disabled through the UI.
		const { isEditorPanelRemoved } = select( editPostStore );
		return {
			isRemoved: isEditorPanelRemoved( PANEL_NAME ),
		};
	} ),
	ifCondition( ( { isRemoved } ) => ! isRemoved ),
] )( PostStatus );
