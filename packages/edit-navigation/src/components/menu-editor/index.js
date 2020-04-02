/**
 * WordPress dependencies
 */
import {
	BlockEditorKeyboardShortcuts,
	BlockEditorProvider,
	BlockList,
	BlockToolbar,
	NavigableToolbar,
	ObserveTyping,
	WritingFlow,
	__experimentalBlockNavigationList,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useViewportMatch } from '@wordpress/compose';
import { Button, Panel, PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import useNavigationBlocks from './use-navigation-blocks';
import MenuEditorShortcuts from './shortcuts';

export default function MenuEditor( { menuId, blockEditorSettings } ) {
	const [ blocks, setBlocks, saveBlocks ] = useNavigationBlocks( menuId );
	const isLargeViewport = useViewportMatch( 'medium' );

	return (
		<div className="edit-navigation-menu-editor">
			<BlockEditorKeyboardShortcuts.Register />
			<MenuEditorShortcuts.Register />

			<BlockEditorProvider
				value={ blocks }
				onInput={ ( updatedBlocks ) => setBlocks( updatedBlocks ) }
				onChange={ ( updatedBlocks ) => setBlocks( updatedBlocks ) }
				settings={ {
					...blockEditorSettings,
					templateLock: 'all',
					hasFixedToolbar: true,
				} }
			>
				<BlockEditorKeyboardShortcuts />
				<MenuEditorShortcuts saveBlocks={ saveBlocks } />
				<Panel>
					<PanelBody
						title={ __( 'Navigation structure' ) }
						initialOpen={ isLargeViewport }
					>
						{ !! blocks.length && (
							<__experimentalBlockNavigationList
								blocks={ blocks }
								selectedBlockClientId={ blocks[ 0 ].clientId }
								selectBlock={ () => {} }
								showNestedBlocks
								showAppender
							/>
						) }
					</PanelBody>
				</Panel>
				<Panel
					header={
						<Button isPrimary onClick={ saveBlocks }>
							{ __( 'Save navigation' ) }
						</Button>
					}
				>
					<PanelBody title={ __( 'Navigation menu' ) }>
						<NavigableToolbar
							className="edit-navigation-menu-editor__toolbar"
							aria-label={ __( 'Block tools' ) }
						>
							<BlockToolbar hideDragHandle />
						</NavigableToolbar>
						<WritingFlow>
							<ObserveTyping>
								<BlockList />
							</ObserveTyping>
						</WritingFlow>
					</PanelBody>
				</Panel>
			</BlockEditorProvider>
		</div>
	);
}
