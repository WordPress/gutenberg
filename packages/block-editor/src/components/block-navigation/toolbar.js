/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { Button, ToolbarGroup } from '@wordpress/components';
import { insertAfter, trash } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockActions from '../block-actions';
import BlockMover from '../block-mover';

export default function BlockNavigationToolbar() {
	const blockClientIds = useSelect(
		( select ) => select( 'core/block-editor' ).getSelectedBlockClientIds(),
		[]
	);

	return (
		<BlockActions clientIds={ blockClientIds }>
			{ ( { canDuplicate, isLocked, onDuplicate, onRemove } ) => (
				<div className="block-editor-block-navigation-toolbar">
					<BlockMover
						clientIds={ blockClientIds }
						__experimentalOrientation="vertical"
						hideDragHandle
					/>
					{ ! isLocked && (
						<ToolbarGroup>
							{ canDuplicate && (
								<Button
									onClick={ onDuplicate }
									label={ __( 'Duplicate block' ) }
									icon={ insertAfter }
								/>
							) }
							<Button
								onClick={ onRemove }
								label={ __( 'Remove block' ) }
								icon={ trash }
							/>
						</ToolbarGroup>
					) }
				</div>
			) }
		</BlockActions>
	);
}
