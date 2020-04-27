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
import { Button, Panel, PanelBody, Popover } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

export default function BlockEditorPanel( { saveBlocks } ) {
	const { isNavigationModeActive, hasSelectedBlock } = useSelect(
		( select ) => {
			const {
				isNavigationMode,
				getBlockSelectionStart,
				getBlock,
			} = select( 'core/block-editor' );

			const selectionStartClientId = getBlockSelectionStart();

			return {
				isNavigationModeActive: isNavigationMode(),
				hasSelectedBlock:
					!! selectionStartClientId &&
					!! getBlock( selectionStartClientId ),
			};
		},
		[]
	);

	return (
		<Panel
			className="edit-navigation-menu-editor__block-editor-panel"
			header={
				<Button isPrimary onClick={ saveBlocks }>
					{ __( 'Save navigation' ) }
				</Button>
			}
		>
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
					<MenuDelete
						menuId={ menuId }
						onDelete={ onDelete }
					/>
				</div>
			</PanelBody>
		</Panel>
	);
}
