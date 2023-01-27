/**
 * WordPress dependencies
 */
import { useViewportMatch, useReducedMotion } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { ToolSelector } from '@wordpress/block-editor';
import {
	Button,
	ToolbarItem,
	__unstableMotion as motion,
	__unstableAnimatePresence as AnimatePresence,
} from '@wordpress/components';
import { EditorHistoryRedo, EditorHistoryUndo } from '@wordpress/editor';
import { useCallback } from '@wordpress/element';
import { listView } from '@wordpress/icons';

const ANIMATION_VARIANTS = {
	init: {
		opacity: 0,
	},
	visible: {
		opacity: 1,
		transition: {
			delay: 0.25,
			duration: 0.2,
		},
	},
	exit: {
		opacity: 0,
		transition: {
			duration: 0.05,
		},
	},
};

export default function InserterClosedItems( {
	isInserterOpened,
	isTextModeEnabled,
	showIconLabels,
	isListViewOpen,
	listViewShortcut,
	setIsListViewOpened,
} ) {
	const isReducedMotion = useReducedMotion();
	const isLargeViewport = useViewportMatch( 'medium' );
	const toggleListView = useCallback(
		() => setIsListViewOpened( ! isListViewOpen ),
		[ setIsListViewOpened, isListViewOpen ]
	);

	return (
		<AnimatePresence initial={ false }>
			{ ! isInserterOpened && (
				<motion.div
					initial={ 'init' }
					animate={ 'visible' }
					exit={ 'exit' }
					variants={
						isReducedMotion ? undefined : ANIMATION_VARIANTS
					}
					className="edit-post-header-toolbar__inserter-closed-items"
				>
					{ isLargeViewport && (
						<ToolbarItem
							as={ ToolSelector }
							showTooltip={ ! showIconLabels }
							variant={ showIconLabels ? 'tertiary' : undefined }
							disabled={ isTextModeEnabled }
						/>
					) }
					<ToolbarItem
						as={ EditorHistoryUndo }
						showTooltip={ ! showIconLabels }
						variant={ showIconLabels ? 'tertiary' : undefined }
					/>
					<ToolbarItem
						as={ EditorHistoryRedo }
						showTooltip={ ! showIconLabels }
						variant={ showIconLabels ? 'tertiary' : undefined }
					/>
					<ToolbarItem
						as={ Button }
						className="edit-post-header-toolbar__document-overview-toggle"
						icon={ listView }
						disabled={ isTextModeEnabled }
						isPressed={ isListViewOpen }
						/* translators: button label text should, if possible, be under 16 characters. */
						label={ __( 'Document Overview' ) }
						onClick={ toggleListView }
						shortcut={ listViewShortcut }
						showTooltip={ ! showIconLabels }
						variant={ showIconLabels ? 'tertiary' : undefined }
					/>
				</motion.div>
			) }
		</AnimatePresence>
	);
}
