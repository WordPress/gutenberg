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
		<div style={ { border: '1px solid black', padding: 10 } }>
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
				<div style={ { border: '1px solid black', padding: 10 } }>
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
				<div style={ { border: '1px solid black', padding: 10 } }>
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
