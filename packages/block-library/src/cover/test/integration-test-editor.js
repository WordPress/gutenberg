/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import {
	BlockEditorKeyboardShortcuts,
	BlockEditorProvider,
	BlockList,
	BlockTools,
	BlockInspector,
	WritingFlow,
	ObserveTyping,
} from '@wordpress/block-editor';
import { Popover, SlotFillProvider } from '@wordpress/components';
import { registerCoreBlocks } from '@wordpress/block-library';
import { ShortcutProvider } from '@wordpress/keyboard-shortcuts';
import '@wordpress/format-library';
import {
	createBlock,
	unregisterBlockType,
	getBlockTypes,
} from '@wordpress/blocks';

export default function Editor( { testBlock, useCoreBlocks = true } ) {
	const [ blocks, updateBlocks ] = useState( [] );

	useEffect( () => {
		if ( useCoreBlocks ) {
			registerCoreBlocks();
		}
		return () => {
			getBlockTypes().forEach( ( { name } ) =>
				unregisterBlockType( name )
			);
		};
	}, [ useCoreBlocks ] );

	useEffect( () => {
		const block = createBlock( testBlock.name, testBlock.attributes || {} );
		updateBlocks( [ block ] );
	}, [ testBlock.name, testBlock.attributes ] );

	return (
		<ShortcutProvider>
			<SlotFillProvider>
				<BlockEditorProvider
					value={ blocks }
					onInput={ updateBlocks }
					onChange={ updateBlocks }
				>
					<BlockInspector />
					<BlockTools>
						<BlockEditorKeyboardShortcuts.Register />
						<WritingFlow>
							<ObserveTyping>
								<BlockList />
							</ObserveTyping>
						</WritingFlow>
					</BlockTools>

					<Popover.Slot />
				</BlockEditorProvider>
			</SlotFillProvider>
		</ShortcutProvider>
	);
}
