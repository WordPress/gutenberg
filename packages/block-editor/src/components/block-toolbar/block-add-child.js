/**
 * WordPress dependencies
 */
import { _x, sprintf } from '@wordpress/i18n';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';
import { store as blockEditorStore } from '../../store';

/**
 * Appends a block into the selected block from its toolbar. The default
 * appender only renders while the block is empty, so appending into a block
 * that has content is served here instead of on the canvas.
 *
 * @param {Object} props          Component props.
 * @param {string} props.clientId The selected block client ID.
 */
export default function BlockAddChild( { clientId } ) {
	const showButton = useSelect(
		( select ) => {
			const {
				getBlockListSettings,
				getBlockOrder,
				getTemplateLock,
				getBlockEditingMode,
			} = select( blockEditorStore );
			const templateLock = getTemplateLock( clientId );
			return (
				!! getBlockListSettings( clientId )?.defaultAppender &&
				getBlockOrder( clientId ).length > 0 &&
				( ! templateLock || templateLock === 'contentOnly' ) &&
				getBlockEditingMode( clientId ) !== 'disabled'
			);
		},
		[ clientId ]
	);

	if ( ! showButton ) {
		return null;
	}

	return (
		<ToolbarGroup>
			<Inserter
				rootClientId={ clientId }
				position="bottom right"
				isAppender
				__experimentalIsQuick
				renderToggle={ ( {
					onToggle,
					disabled,
					isOpen,
					blockTitle,
					hasSingleBlockType,
				} ) => (
					<ToolbarButton
						icon={ plus }
						label={
							hasSingleBlockType
								? sprintf(
										// translators: %s: the name of the block when there is only one.
										_x(
											'Add %s',
											'directly add the only allowed block'
										),
										blockTitle
								  )
								: _x(
										'Add block',
										'Generic label for block inserter button'
								  )
						}
						onClick={ onToggle }
						aria-haspopup={
							! hasSingleBlockType ? 'true' : undefined
						}
						aria-expanded={
							! hasSingleBlockType ? isOpen : undefined
						}
						disabled={ disabled }
					/>
				) }
			/>
		</ToolbarGroup>
	);
}
