/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from '../button';

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
		<div className="components-language-chooser__active-locales-controls">
			<ul>
				<li>
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
					>
						{ __( 'Move Up' ) }
					</Button>
				</li>
				<li>
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
					>
						{ __( 'Move Down' ) }
					</Button>
				</li>
				<li>
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
					>
						{ __( 'Remove' ) }
					</Button>
				</li>
			</ul>
		</div>
	);
}

export default ActiveControls;
