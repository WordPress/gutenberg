/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { getPrimaryNoteByBlock } from './utils';
import NoteIndicatorAvatar from './note-indicator-avatar';

const { PrivateBlockPopover } = unlock( blockEditorPrivateApis );

const INDICATOR_PLACEMENT = isRTL() ? 'left-start' : 'right-start';

/**
 * Renders a persistent avatar over every block that has an unresolved note,
 * so notes are discoverable at a glance instead of only on block selection.
 *
 * @param {Object}   props                   Component props.
 * @param {Array}    props.notes             Unresolved note threads.
 * @param {Function} props.onSelectBlockNote Called with a block's clientId when its indicator is clicked.
 */
export function NotesBlockIndicators( { notes, onSelectBlockNote } ) {
	const blockNotes = useMemo(
		() => getPrimaryNoteByBlock( notes ),
		[ notes ]
	);

	return (
		<>
			{ blockNotes.map( ( { clientId, note } ) => (
				<PrivateBlockPopover
					key={ clientId }
					clientId={ clientId }
					placement={ INDICATOR_PLACEMENT }
					offset={ 8 }
					resize={ false }
					flip={ false }
					className="editor-collab-sidebar__note-indicator-popover"
					__unstablePopoverSlot="__unstable-block-tools-after"
				>
					<NoteIndicatorAvatar
						note={ note }
						onClick={ () => onSelectBlockNote( clientId ) }
					/>
				</PrivateBlockPopover>
			) ) }
		</>
	);
}
