/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	BlockList,
	BlockToolbar,
	NavigableToolbar,
	ObserveTyping,
	WritingFlow,
} from '@wordpress/block-editor';
import {
	Button,
	CheckboxControl,
	Panel,
	PanelBody,
	Popover,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DeleteMenuButton from '../delete-menu-button';

export default function BlockEditorPanel( {
	onDeleteMenu,
	menuId,
	saveBlocks,
} ) {
	const { rootBlockId, isNavigationModeActive, hasSelectedBlock } = useSelect(
		( select ) => {
			const {
				isNavigationMode,
				getBlockSelectionStart,
				getBlock,
				getBlocks,
			} = select( 'core/block-editor' );

			const selectionStartClientId = getBlockSelectionStart();

			return {
				rootBlockId: getBlocks()[ 0 ]?.clientId,
				isNavigationModeActive: isNavigationMode(),
				hasSelectedBlock:
					!! selectionStartClientId &&
					!! getBlock( selectionStartClientId ),
			};
		},
		[]
	);
	const { saveMenu } = useDispatch( 'core' );
	const menu = useSelect( ( select ) => select( 'core' ).getMenu( menuId ), [
		menuId,
	] );

	let autoAdd = false;
	if ( menu ) {
		autoAdd = menu.auto_add;
	}

	const [ autoAddPages, setAutoAddPages ] = useState( autoAdd );

	useEffect( () => {
		setAutoAddPages( menu.auto_add );
	}, [ menuId ] );

	// Select the navigation block when it becomes available
	const { selectBlock } = useDispatch( 'core/block-editor' );
	useEffect( () => {
		if ( rootBlockId ) {
			selectBlock( rootBlockId );
		}
	}, [ rootBlockId ] );

	return (
		<Panel className="edit-navigation-menu-editor__block-editor-panel">
			<PanelBody title={ __( 'Navigation menu' ) }>
				<div className="components-panel__header-actions">
					<Button isPrimary onClick={ saveBlocks }>
						{ __( 'Save navigation' ) }
					</Button>
				</div>
				<NavigableToolbar
					className={ classnames(
						'edit-navigation-menu-editor__block-editor-toolbar',
						{
							'is-hidden': isNavigationModeActive,
						}
					) }
					aria-label={ __( 'Block tools' ) }
				>
					{ hasSelectedBlock && <BlockToolbar hideDragHandle /> }
				</NavigableToolbar>
				<Popover.Slot name="block-toolbar" />
				<WritingFlow>
					<ObserveTyping>
						<BlockList />
					</ObserveTyping>
				</WritingFlow>
				<CheckboxControl
					label={ __(
						'Automatically add new top-level pages to this menu'
					) }
					help={ __(
						'New menu items will automatically appear in this menu as new top level pages are added to your site'
					) }
					onChange={ async () => {
						setAutoAddPages( ! autoAddPages );
						saveMenu( {
							...menu,
							auto_add: ! autoAddPages,
						} );
					} }
					checked={ autoAddPages }
				/>
				<div className="components-panel__footer-actions">
					<DeleteMenuButton
						menuId={ menuId }
						onDelete={ onDeleteMenu }
					/>
				</div>
			</PanelBody>
		</Panel>
	);
}
