/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { NavigableToolbar } from '@wordpress/block-editor';
import { useViewportMatch } from '@wordpress/compose';
import { PinnedItems } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import MenuActions from './menu-actions';
import NewButton from './new-button';
import SaveButton from './save-button';
import UndoButton from './undo-button';
import RedoButton from './redo-button';
import InserterToggle from './inserter-toggle';
import MoreMenu from './more-menu';

export default function Header( {
	isMenuSelected,
	menus,
	isPending,
	navigationPost,
} ) {
	const isMediumViewport = useViewportMatch( 'medium' );

	if ( ! isMenuSelected ) {
		return (
			<div className="edit-navigation-header">
				<div className="edit-navigation-header__toolbar-wrapper">
					<h1 className="edit-navigation-header__title">
						{ __( 'Navigation' ) }
					</h1>
				</div>
			</div>
		);
	}

	return (
		<div className="edit-navigation-header">
			<div className="edit-navigation-header__toolbar-wrapper">
				{ isMediumViewport && (
					<h1 className="edit-navigation-header__title">
						{ __( 'Navigation' ) }
					</h1>
				) }

				<NavigableToolbar
					className="edit-navigation-header__toolbar"
					aria-label={ __( 'Document tools' ) }
				>
					<InserterToggle />
					{ isMediumViewport && (
						<>
							<UndoButton />
							<RedoButton />
						</>
					) }
				</NavigableToolbar>
			</div>

			<MenuActions menus={ menus } isLoading={ isPending } />

			<div className="edit-navigation-header__actions">
				{ isMediumViewport && <NewButton /> }
				<SaveButton navigationPost={ navigationPost } />
				<PinnedItems.Slot scope="core/edit-navigation" />
				<MoreMenu />
			</div>
		</div>
	);
}
