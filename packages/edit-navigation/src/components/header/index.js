/**
 * WordPress dependencies
 */
import {
	NavigableToolbar,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { DropdownMenu, Button, ToolbarItem } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { PinnedItems } from '@wordpress/interface';
import { __, sprintf, _x } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import SaveButton from './save-button';
import UndoButton from './undo-button';
import RedoButton from './redo-button';
import MenuSwitcher from '../menu-switcher';
import {
	useMenuEntityProp,
	useNavigationEditorInsertionPoint,
} from '../../hooks';
import { store as editNavigationStore } from '../../store';

export default function Header( {
	isMenuSelected,
	menus,
	selectedMenuId,
	onSelectMenu,
	isPending,
	navigationPost,
} ) {
	const inserterButton = useRef();
	const isMediumViewport = useViewportMatch( 'medium' );
	const [ menuName ] = useMenuEntityProp( 'name', selectedMenuId );

	const { rootClientId } = useNavigationEditorInsertionPoint();

	const { isInserterOpened, hasInserterItems } = useSelect( ( select ) => {
		return {
			hasInserterItems: select( blockEditorStore ).hasInserterItems(
				rootClientId
			),
			isInserterOpened: select( editNavigationStore ).isInserterOpened(),
		};
	} );

	const { setIsInserterOpened } = useDispatch( editNavigationStore );

	let actionHeaderText;

	if ( menuName ) {
		actionHeaderText = sprintf(
			// translators: Name of the menu being edited, e.g. 'Main Menu'.
			__( 'Editing: %s' ),
			menuName
		);
	} else if ( isPending ) {
		// Loading text won't be displayed if menus are preloaded.
		actionHeaderText = __( 'Loading …' );
	} else {
		actionHeaderText = __( 'No menus available' );
	}

	return (
		<div className="edit-navigation-header">
			{ isMediumViewport && (
				<div className="edit-navigation-header__toolbar-wrapper">
					<h1 className="edit-navigation-header__title">
						{ __( 'Navigation' ) }
					</h1>
					<NavigableToolbar
						className="edit-navigation-header__toolbar"
						aria-label={ __( 'Document tools' ) }
					>
						<ToolbarItem
							ref={ inserterButton }
							as={ Button }
							className="edit-navigation-header-toolbar__inserter-toggle"
							variant="primary"
							isPressed={ isInserterOpened }
							onMouseDown={ ( event ) => {
								event.preventDefault();
							} }
							onClick={ () => {
								if ( isInserterOpened ) {
									// Focusing the inserter button closes the inserter popover
									// @ts-ignore
									inserterButton.current.focus();
								} else {
									setIsInserterOpened( true );
								}
							} }
							icon={ plus }
							/* translators: button label text should, if possible, be under 16
					characters. */
							label={ _x(
								'Toggle block inserter',
								'Generic label for block inserter button'
							) }
							disabled={ ! hasInserterItems }
						/>

						<UndoButton />
						<RedoButton />
					</NavigableToolbar>
				</div>
			) }
			<h2 className="edit-navigation-header__subtitle">
				{ isMenuSelected && decodeEntities( actionHeaderText ) }
			</h2>
			{ isMenuSelected && (
				<div className="edit-navigation-header__actions">
					<DropdownMenu
						icon={ null }
						toggleProps={ {
							children: __( 'Switch menu' ),
							'aria-label': __(
								'Switch menu, or create a new menu'
							),
							showTooltip: false,
							variant: 'tertiary',
							disabled: ! menus?.length,
							__experimentalIsFocusable: true,
						} }
						popoverProps={ {
							className:
								'edit-navigation-header__menu-switcher-dropdown',
							position: 'bottom center',
						} }
					>
						{ ( { onClose } ) => (
							<MenuSwitcher
								menus={ menus }
								selectedMenuId={ selectedMenuId }
								onSelectMenu={ ( menuId ) => {
									onSelectMenu( menuId );
									onClose();
								} }
							/>
						) }
					</DropdownMenu>

					<SaveButton navigationPost={ navigationPost } />
					<PinnedItems.Slot scope="core/edit-navigation" />
				</div>
			) }
		</div>
	);
}
