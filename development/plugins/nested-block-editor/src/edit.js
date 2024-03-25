import React from 'react';
import { parse, serialize } from '@wordpress/blocks';
import {
	BlockEditorProvider,
	BlockList,
	BlockTools,
	DefaultBlockAppender,
	ObserveTyping,
	WritingFlow,
	useBlockProps,
	BlockEditorKeyboardShortcuts,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { Popover, SlotFillProvider } from '@wordpress/components';
import './editor.scss';

const EDITOR_SETTINGS = {
	allowedBlockTypes: [
		'core/paragraph',
		'core/button',
		'core/buttons',
		'core/image'
	],
	codeEditingEnabled: false,
};

const BlockDeselectListener = ({ editorRef }) => {
	const { clearSelectedBlock } = useDispatch(blockEditorStore);

	const blurListener = (event) => {
		if (!editorRef.current || editorRef.current.contains(event.target)) {
			return;
		}

		clearSelectedBlock();
	};

	React.useEffect(() => {
		document.body.addEventListener('click', blurListener, { capture: true });

		return () => document.body.removeEventListener('click', blurListener, { capture: true });
	}, []);

	return null;
};

export default function Edit() {
	const blockProps = useBlockProps();
	const [currentBlocks, setCurrentBlocks] = React.useState(parse(''));
	const editorRef = React.useRef(null);

	const updateValue = (blocks) => {
		setCurrentBlocks(serialize(blocks));
	};

	return (
		<div { ...blockProps }>
			<BlockEditorProvider
				value={parse(currentBlocks)}
				onInput={(blocks) => {
					updateValue(blocks);
				}}
				onChange={(blocks) => {
					updateValue(blocks);
				}}
				settings={EDITOR_SETTINGS}
			>
				<div ref={editorRef} className="editor-container">
					<SlotFillProvider>
						<div className="editor-styles-wrapper">
							<BlockEditorKeyboardShortcuts.Register/>
							<BlockTools>
								<WritingFlow>
									<ObserveTyping>
										<div>
											<BlockList
												renderAppender={DefaultBlockAppender}
												className="content-field-blocks-list"
											/>
											<BlockDeselectListener editorRef={editorRef}/>
										</div>
									</ObserveTyping>
								</WritingFlow>
							</BlockTools>
						</div>
						<Popover.Slot/>
					</SlotFillProvider>
				</div>
			</BlockEditorProvider>
		</div>
	);
}
