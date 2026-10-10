import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { speak } from '@wordpress/a11y';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * The single "Edit" toggle of the block toolbar. What it edits depends on the
 * selection:
 *
 * - On an unsynced pattern section it unlocks the section's blocks, the same
 *   as the "Edit pattern" button it replaces.
 * - On any other block it swaps the toolbar from the block-level actions to
 *   the block's editing tools. The canvas behaves the same either way.
 *
 * The label stays "Edit" in both states, as a toggle's label should; the
 * pressed state tells which state is active.
 *
 * @param props           Component props.
 * @param props.clientId  The client id of the selected block.
 * @param props.isSection Whether the toggle unlocks a section.
 */
export default function BlockEditToggle( {
	clientId,
	isSection,
}: {
	clientId: string;
	isSection: boolean;
} ) {
	const { isPressed } = useSelect(
		( select ) => {
			const { getEditedContentOnlySection, getBlockToolbarView } = unlock(
				select( blockEditorStore )
			);
			return {
				isPressed: isSection
					? getEditedContentOnlySection() === clientId
					: getBlockToolbarView( clientId ) === 'content',
			};
		},
		[ clientId, isSection ]
	);
	const {
		editContentOnlySection,
		stopEditingContentOnlySection,
		setBlockToolbarView,
	} = unlock( useDispatch( blockEditorStore ) );

	function onClick() {
		if ( ! isSection ) {
			setBlockToolbarView( clientId, isPressed ? 'block' : 'content' );
			return;
		}

		// Unlocking a section changes what can be edited in the canvas, which
		// the pressed state alone doesn't convey.
		if ( isPressed ) {
			stopEditingContentOnlySection();
			speak( __( 'Finished editing pattern.' ) );
		} else {
			editContentOnlySection( clientId );
			speak( __( 'Editing pattern. Its blocks are unlocked.' ) );
		}
	}

	return (
		<ToolbarButton
			className="block-editor-block-toolbar__edit-toggle"
			isActive={ isPressed }
			onClick={ onClick }
			description={
				isSection
					? __( 'Unlock the blocks in this pattern to edit them.' )
					: __( 'Show the editing tools for this block.' )
			}
		>
			{
				/* translators: Toolbar toggle that switches between a block's actions and its editing tools. */
				__( 'Edit' )
			}
		</ToolbarButton>
	);
}
