/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button, ButtonGroup } from '@wordpress/components';

interface ActiveControlsProps {
	onMoveUp: () => void;
	onMoveDown: () => void;
	onRemove: () => void;
	isMoveUpDisabled: boolean;
	isMoveDownDisabled: boolean;
	isRemoveDisabled: boolean;
}
function ActiveControls( {
	onMoveUp,
	onMoveDown,
	onRemove,
	isMoveUpDisabled,
	isMoveDownDisabled,
	isRemoveDisabled,
}: ActiveControlsProps ) {
	return (
		<ButtonGroup>
			<Button
				variant="secondary"
				showTooltip
				aria-keyshortcuts="ArrowUp"
				aria-label={ sprintf(
					/* translators: accessibility text */
					__( 'Move up (%s)' ),
					/* translators: keyboard shortcut (Arrow Up) */
					__( 'Up' )
				) }
				label={
					/* translators: keyboard shortcut (Arrow Up) */
					__( 'Up' )
				}
				disabled={ isMoveUpDisabled }
				accessibleWhenDisabled
				onClick={ onMoveUp }
				__next40pxDefaultSize
			>
				{ __( 'Move Up' ) }
			</Button>
			<Button
				variant="secondary"
				showTooltip
				aria-keyshortcuts="ArrowDown"
				aria-label={ sprintf(
					/* translators: accessibility text */
					__( 'Move down (%s)' ),
					/* translators: keyboard shortcut (Arrow Down) */
					__( 'Down' )
				) }
				label={
					/* translators: keyboard shortcut (Arrow Down) */
					__( 'Down' )
				}
				disabled={ isMoveDownDisabled }
				accessibleWhenDisabled
				onClick={ onMoveDown }
				__next40pxDefaultSize
			>
				{ __( 'Move Down' ) }
			</Button>
			<Button
				variant="secondary"
				showTooltip
				aria-keyshortcuts="Delete"
				aria-label={ sprintf(
					/* translators: accessibility text */
					__( 'Remove from list (%s)' ),
					/* translators: keyboard shortcut (Delete / Backspace) */
					__( 'Delete' )
				) }
				label={
					/* translators: keyboard shortcut (Delete / Backspace) */
					__( 'Delete' )
				}
				disabled={ isRemoveDisabled }
				accessibleWhenDisabled
				onClick={ onRemove }
				__next40pxDefaultSize
			>
				{ __( 'Remove' ) }
			</Button>
		</ButtonGroup>
	);
}

export default ActiveControls;
