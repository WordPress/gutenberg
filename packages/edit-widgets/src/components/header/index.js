/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Button, NavigableMenu } from '@wordpress/components';
import { BlockNavigationDropdown, BlockToolbar } from '@wordpress/block-editor';
import { PinnedItems } from '@wordpress/interface';
import { useViewportMatch } from '@wordpress/compose';
import { plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import SaveButton from '../save-button';
import UndoButton from './undo-redo/undo';
import RedoButton from './undo-redo/redo';

function Header( {
	isCustomizer,
	isInserterOpen,
	onInserterToggle,
	rootClientId,
} ) {
	const isLargeViewport = useViewportMatch( 'medium' );

	return (
		<>
			<div className="edit-widgets-header">
				<NavigableMenu>
					<Button
						icon={ plus }
						label={ _x(
							'Add block',
							'Generic label for block inserter button'
						) }
						tooltipPosition="bottom"
						onClick={ onInserterToggle }
						className="block-editor-inserter__toggle"
						aria-haspopup={ 'true' }
						aria-expanded={ isInserterOpen }
						disabled={ ! rootClientId }
						isPressed={ isInserterOpen }
						isPrimary
					/>
					<UndoButton />
					<RedoButton />
					<BlockNavigationDropdown />
				</NavigableMenu>
				{ ! isCustomizer && (
					<h1 className="edit-widgets-header__title">
						{ __( 'Block Areas' ) } { __( '(experimental)' ) }
					</h1>
				) }
				<div className="edit-widgets-header__actions">
					{ ! isCustomizer && <SaveButton /> }
					<PinnedItems.Slot
						scope={
							isCustomizer
								? 'core/edit-widgets-customizer'
								: 'core/edit-widgets'
						}
					/>
				</div>
			</div>
			{ ( ! isLargeViewport || isCustomizer ) && (
				<div className="edit-widgets-header__block-toolbar">
					<BlockToolbar hideDragHandle />
				</div>
			) }
		</>
	);
}

export default Header;
