import { ToolbarButton } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { plus } from '@wordpress/icons';
import { _x, sprintf } from '@wordpress/i18n';
import Inserter from '../inserter';
import { useParentInserter } from '../block-parent-selector/use-parent-inserter';
import { canAppendBlocks } from './can-append';

/**
 * Adds a block at the end of the selected block's own list, the job the
 * appender in the corner of a filled container used to do. Renders
 * nothing when the block takes no appended blocks.
 *
 * @param props          Component props.
 * @param props.clientId The selected block client ID.
 */
export default function BlockAppenderButton( {
	clientId,
}: {
	clientId: string;
} ) {
	// The parent selector's inserter already adds a block next to the
	// selected one; a second plus button in the same toolbar would be
	// two ways to add a block, a row apart.
	const { showInserter: parentShowsInserter } = useParentInserter();
	const canAppend = useSelect(
		( select ) => canAppendBlocks( select, clientId ),
		[ clientId ]
	);

	if ( ! canAppend || parentShowsInserter ) {
		return null;
	}

	return (
		<Inserter
			position="bottom right"
			rootClientId={ clientId }
			isAppender
			__experimentalIsQuick
			renderToggle={ ( {
				onToggle,
				isOpen,
				disabled,
				blockTitle,
				hasSingleBlockType,
			}: {
				onToggle: () => void;
				isOpen: boolean;
				disabled: boolean;
				blockTitle: string;
				hasSingleBlockType: boolean;
			} ) => (
				<ToolbarButton
					className="block-editor-block-appender-button"
					onClick={ onToggle }
					aria-expanded={ isOpen }
					disabled={ disabled }
					label={
						hasSingleBlockType
							? sprintf(
									// translators: %s: the name of the block when there is only one
									_x(
										'Add %s',
										'directly add the only allowed block'
									),
									blockTitle.toLowerCase()
							  )
							: _x(
									'Add block',
									'Generic label for block inserter button'
							  )
					}
					showTooltip
					icon={ plus }
				/>
			) }
		/>
	);
}
