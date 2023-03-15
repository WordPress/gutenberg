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
			if ( useCoreBlocks ) {
				getBlockTypes().forEach( ( { name } ) =>
					unregisterBlockType( name )
				);
			}
		};
	}, [ useCoreBlocks ] );

	useEffect( () => {
		const block = createBlock( testBlock.name, testBlock.attributes || {} );
		updateBlocks( [ block ] );
	}, [ testBlock.name, testBlock.attributes ] );

	return (
		<div className="integration-test-editor">
			<ShortcutProvider>
				<SlotFillProvider>
					<BlockEditorProvider
						value={ blocks }
						onInput={ updateBlocks }
						onChange={ updateBlocks }
					>
						<div className="integration-test-editor__sidebar">
							<BlockInspector />
						</div>
						<div className="integration-test-editor__content">
							<BlockTools>
								<div className="editor-styles-wrapper">
									<BlockEditorKeyboardShortcuts.Register />
									<WritingFlow>
										<ObserveTyping>
											<BlockList />
										</ObserveTyping>
									</WritingFlow>
								</div>
							</BlockTools>
						</div>
						<Popover.Slot />
					</BlockEditorProvider>
				</SlotFillProvider>
			</ShortcutProvider>
		</div>
	);
}
