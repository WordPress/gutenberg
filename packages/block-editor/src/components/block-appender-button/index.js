import { ToolbarButton } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { getBlockType, hasBlockSupport } from '@wordpress/blocks';
import { plus } from '@wordpress/icons';
import { _x, sprintf } from '@wordpress/i18n';
import Inserter from '../inserter';
import { useParentInserter } from '../block-parent-selector/use-parent-inserter';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Adds a block at the end of the selected block's own list, the job the
 * appender in the corner of a filled container used to do.
 *
 * @param {Object} props          Component props.
 * @param {string} props.clientId The selected block client ID.
 *
 * @return {Component|null} The button, or nothing when the block takes no
 *                          appended blocks.
 */
export default function BlockAppenderButton( { clientId } ) {
	// The parent selector's inserter already adds a block next to the
	// selected one; a second plus button in the same toolbar would be
	// two ways to add a block, a row apart.
	const { showInserter: parentShowsInserter } = useParentInserter();
	const canAppend = useSelect(
		( select ) => {
			const {
				getBlockName,
				getBlockOrder,
				getBlockListSettings,
				getTemplateLock,
				getBlockEditingMode,
				isSectionBlock,
			} = unlock( select( blockEditorStore ) );

			if ( ! clientId ) {
				return false;
			}

			// An empty list shows its own appender in place, where the
			// blocks will land.
			if ( ! getBlockOrder( clientId ).length ) {
				return false;
			}

			// Only a block that renders a block list takes appended
			// blocks. The settings are registered by the list itself.
			if ( ! getBlockListSettings( clientId ) ) {
				return false;
			}

			// A container that merges with the text flow (a list, a
			// quote) grows by typing: Enter continues it, and users know
			// that.
			const blockType = getBlockType( getBlockName( clientId ) );
			if (
				blockType?.merge ||
				hasBlockSupport( blockType, '__experimentalOnMerge' )
			) {
				return false;
			}

			// A section's content is locked, and a locked or disabled
			// list takes nothing.
			return (
				! isSectionBlock( clientId ) &&
				! getTemplateLock( clientId ) &&
				getBlockEditingMode( clientId ) === 'default'
			);
		},
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
