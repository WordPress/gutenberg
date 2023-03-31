/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose, ifCondition } from '@wordpress/compose';

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
import {
	Slot as PluginPostStatusInfoSlot,
	Fill as PluginPostStatusInfoFill,
} from '../plugin-post-status-info';
import { store as editPostStore } from '../../../store';
import PostTemplate from '../post-template';
import PostURL from '../post-url';

function One() {
	return (
		<PluginPostStatusInfoFill priority={ 1 }>
			<div>One</div>
		</PluginPostStatusInfoFill>
	);
}

function Two() {
	return (
		<PluginPostStatusInfoFill priority={ 2 }>
			<div>Two</div>
		</PluginPostStatusInfoFill>
	);
}

function Three() {
	return (
		<PluginPostStatusInfoFill priority={ 3 }>
			<div>Three</div>
		</PluginPostStatusInfoFill>
	);
}

function Four() {
	return (
		<PluginPostStatusInfoFill priority={ 4 }>
			<div>Four</div>
		</PluginPostStatusInfoFill>
	);
}

/**
 * Module Constants
 */
const PANEL_NAME = 'post-status';

const PostStatusTrashFill = () => {
	return (
		<PluginPostStatusInfoFill priority={ 99 }>
			<PostTrash />
		</PluginPostStatusInfoFill>
	);
};
const PostStatusInfoFill = () => {
	return (
		<PluginPostStatusInfoFill priority={ 2 }>
			<PostVisibility />
			<PostSchedule />
			<PostTemplate />
			<PostURL />
			<PostSticky />
			<PostPendingStatus />
			<PostFormat />
			<PostSlug />
			<PostAuthor />
		</PluginPostStatusInfoFill>
	);
};

function PostStatus( { isOpened, onTogglePanel } ) {
	return (
		<PanelBody
			className="edit-post-post-status"
			title={ __( 'Summary' ) }
			opened={ isOpened }
			onToggle={ onTogglePanel }
		>
			<Four />
			<One />
			<Two />
			<Three />
			<PostStatusTrashFill />
			<PostStatusInfoFill />
			<PluginPostStatusInfoSlot bubblesVirtually />
		</PanelBody>
	);
}

export default compose( [
	withSelect( ( select ) => {
		// We use isEditorPanelRemoved to hide the panel if it was programatically removed. We do
		// not use isEditorPanelEnabled since this panel should not be disabled through the UI.
		const { isEditorPanelRemoved, isEditorPanelOpened } =
			select( editPostStore );
		return {
			isRemoved: isEditorPanelRemoved( PANEL_NAME ),
			isOpened: isEditorPanelOpened( PANEL_NAME ),
		};
	} ),
	ifCondition( ( { isRemoved } ) => ! isRemoved ),
	withDispatch( ( dispatch ) => ( {
		onTogglePanel() {
			return dispatch( editPostStore ).toggleEditorPanelOpened(
				PANEL_NAME
			);
		},
	} ) ),
] )( PostStatus );
