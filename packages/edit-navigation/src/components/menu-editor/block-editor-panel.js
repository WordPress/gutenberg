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
import {
	Button,
	Card,
	CardHeader,
	CardBody,
	Popover,
} from '@wordpress/components';
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

	// Select the navigation block when it becomes available
	const { selectBlock } = useDispatch( 'core/block-editor' );
	useEffect( () => {
		if ( rootBlockId ) {
			selectBlock( rootBlockId );
		}
	}, [ rootBlockId ] );

	return (
		<Card className="edit-navigation-menu-editor__block-editor-panel">
			<CardHeader className="edit-navigation-menu-editor__block-editor-panel-header">
				{ __( 'Navigation menu' ) }
			</CardHeader>
			<CardBody>
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
			</CardBody>
		</Card>
	);
}
