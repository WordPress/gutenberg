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
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import useNavigationBlocks from './use-navigation-blocks';

export default function MenuEditor( { menuId, blockEditorSettings } ) {
	const [ blocks, setBlocks, saveBlocks ] = useNavigationBlocks( menuId );

	return (
		<div className="edit-navigation-menu-editor">
			<BlockEditorKeyboardShortcuts.Register />
			<Button isPrimary onClick={ saveBlocks }>
				{ __( 'Save' ) }
			</Button>
			<BlockEditorProvider
				value={ blocks }
				onInput={ ( updatedBlocks ) => setBlocks( updatedBlocks ) }
				onChange={ ( updatedBlocks ) => setBlocks( updatedBlocks ) }
				settings={ {
					...blockEditorSettings,
					templateLock: 'all',
				} }
			>
				<div className="edit-navigation-menu-editor__panel">
					{ !! blocks.length && (
						<__experimentalBlockNavigationList
							blocks={ blocks }
							selectedBlockClientId={ blocks[ 0 ].clientId }
							selectBlock={ () => {} }
							showNestedBlocks
							showAppender
						/>
					) }
				</div>
				<div className="edit-navigation-menu-editor__panel">
					<WritingFlow>
						<ObserveTyping>
							<BlockList />
						</ObserveTyping>
					</WritingFlow>
				</div>
			</BlockEditorProvider>
		</div>
	);
}
