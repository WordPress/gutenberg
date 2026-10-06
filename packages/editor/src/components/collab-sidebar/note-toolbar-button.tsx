// @ts-expect-error - No type declarations available for @wordpress/block-editor
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { ToolbarButton } from '@wordpress/components';
import { _n, sprintf } from '@wordpress/i18n';
import { comment as commentIcon } from '@wordpress/icons';
import { unlock } from '../../lock-unlock';

const { NoteIconToolbarSlotFill } = unlock( blockEditorPrivateApis );

type NoteToolbarButtonProps = {
	/**
	 * Number of note threads on the block.
	 */
	count: number;

	/**
	 * Called to focus the block's primary note.
	 */
	onClick: () => void;
};

/**
 * Renders the block toolbar's notes button, which focuses the notes already on
 * the selected block.
 *
 * The count lives in the button's label rather than in a second icon or a
 * badge, so a block carrying notes reads as one to a screen reader as well as
 * on screen. A block without notes renders no button, which is what sets it
 * apart today.
 *
 * Only blocks that already carry notes get the button. Showing it on every
 * block, as the affordance for adding a first note, is proposed separately in
 * https://github.com/WordPress/gutenberg/issues/78188; the button keeps the one
 * job either way, switching its label and action on the count.
 *
 * @param props         Component props.
 * @param props.count   Number of note threads on the block.
 * @param props.onClick Called to focus the block's primary note.
 */
export function NoteToolbarButton( {
	count,
	onClick,
}: NoteToolbarButtonProps ) {
	if ( ! count ) {
		return null;
	}

	return (
		<NoteIconToolbarSlotFill.Fill>
			<ToolbarButton
				icon={ commentIcon }
				label={ sprintf(
					// translators: %d: Number of notes on the block.
					_n( 'View %d note', 'View %d notes', count ),
					count
				) }
				onClick={ () => onClick() }
			/>
		</NoteIconToolbarSlotFill.Fill>
	);
}
