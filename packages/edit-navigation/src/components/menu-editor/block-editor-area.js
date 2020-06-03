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
	CardFooter,
	Popover,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DeleteMenuButton from '../delete-menu-button';

export default function BlockEditorArea( {
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
		<Card className="edit-navigation-menu-editor__block-editor-area">
			<CardHeader>
				<div className="edit-navigation-menu-editor__block-editor-area-header-text">
					{ __( 'Navigation menu' ) }
				</div>

				<Button isPrimary onClick={ saveBlocks }>
					{ __( 'Save navigation' ) }
				</Button>
			</CardHeader>
			<CardBody>
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
			</CardBody>
			<CardFooter>
				<DeleteMenuButton menuId={ menuId } onDelete={ onDeleteMenu } />
				<Button isPrimary onClick={ saveBlocks }>
					{ __( 'Save navigation' ) }
				</Button>
			</CardFooter>
		</Card>
	);
}
