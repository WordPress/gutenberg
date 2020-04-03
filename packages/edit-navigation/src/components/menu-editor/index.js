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
import { useDispatch } from '@wordpress/data';
/**
 * Internal dependencies
 */
import useNavigationBlocks from './use-navigation-blocks';
import MenuEditorShortcuts from './shortcuts';

export default function MenuEditor( {
	menuId,
	blockEditorSettings,
	onDelete,
} ) {
	const [ blocks, setBlocks, saveBlocks ] = useNavigationBlocks( menuId );
	const { deleteMenu } = useDispatch( 'core' );
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
				} }
			>
				<BlockEditorKeyboardShortcuts />
				<MenuEditorShortcuts saveBlocks={ saveBlocks } />
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
				<Panel className="edit-navigation-menu-editor__panel">
					<PanelBody title={ __( 'Navigation menu' ) }>
						<div className="components-panel__header-actions">
							<Button isPrimary onClick={ saveBlocks }>
								{ __( 'Save navigation' ) }
							</Button>
							<Button
								isPrimary
								onClick={ () => {
									deleteMenu( menuId );
									onDelete( menuId );
								} }
							>
								{ __( 'Delete navigation' ) }
							</Button>
						</div>
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
