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
			const { isNavigationMode, getSelectedBlock } = select(
				'core/block-editor'
			);

			return {
				isNavigationModeActive: isNavigationMode(),
				hasSelectedBlock: !! getSelectedBlock(),
			};
		},
		[]
	);

	return (
		<Panel
			header={
				<Button isPrimary onClick={ saveBlocks }>
					{ __( 'Save navigation' ) }
				</Button>
			}
		>
			<PanelBody title={ __( 'Navigation menu' ) }>
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
			</PanelBody>
		</Panel>
	);
}
