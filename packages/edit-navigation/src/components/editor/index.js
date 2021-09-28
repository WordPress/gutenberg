/**
 * WordPress dependencies
 */
import { BlockList, ObserveTyping, WritingFlow } from '@wordpress/block-editor';
import { Spinner } from '@wordpress/components';

export default function Editor( { isPending } ) {
	return (
		<div className="edit-navigation-editor">
			{ isPending ? (
				<Spinner />
			) : (
				<div className="editor-styles-wrapper">
					<WritingFlow>
						<ObserveTyping>
							<BlockList />
						</ObserveTyping>
					</WritingFlow>
				</div>
			) }
		</div>
	);
}
