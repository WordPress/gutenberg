/**
 * WordPress dependencies
 */
import {
	BlockEditorKeyboardShortcuts,
	BlockEditorProvider,
	BlockList,
	ObserveTyping,
	WritingFlow,
	__experimentalBlockNavigationList,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { Panel, PanelBody, Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import useNavigationBlocks from './use-navigation-blocks';

export default function MenuEditor( { menuId, blockEditorSettings } ) {
	const [ blocks, setBlocks, saveBlocks ] = useNavigationBlocks( menuId );

	return (
		<div className="edit-navigation-menu-editor">
			<BlockEditorKeyboardShortcuts.Register />

			<BlockEditorProvider
				value={ blocks }
				onInput={ ( updatedBlocks ) => setBlocks( updatedBlocks ) }
				onChange={ ( updatedBlocks ) => setBlocks( updatedBlocks ) }
				settings={ {
					...blockEditorSettings,
					templateLock: 'all',
				} }
			>
				<BlockEditorKeyboardShortcuts />
				<Panel className="edit-navigation-menu-editor__panel">
					<PanelBody title={ __( 'Navigation structure' ) }>
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
					className="edit-navigation-menu-editor__panel"
				>
					<PanelBody title={ __( 'Navigation menu' ) }>
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
