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
import { useEffect } from '@wordpress/element';
import { Button, Panel, PanelBody, Popover } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
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
	const { rootBlock, isNavigationModeActive, hasSelectedBlock } = useSelect(
		( select ) => {
			const {
				isNavigationMode,
				getBlockSelectionStart,
				getBlock,
				getBlocks,
			} = select( 'core/block-editor' );

			const selectionStartClientId = getBlockSelectionStart();

			return {
				rootBlock: getBlocks()[ 0 ],
				isNavigationModeActive: isNavigationMode(),
				hasSelectedBlock:
					!! selectionStartClientId &&
					!! getBlock( selectionStartClientId ),
			};
		},
		[]
	);

	// Select the navigation block when it becomes available
	const { selectBlock } = useDispatch( 'core/block-editor' );
	useEffect( () => {
		if ( rootBlock?.clientId ) {
			selectBlock( rootBlock.clientId );
		}
	}, [ rootBlock?.clientId ] );

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
