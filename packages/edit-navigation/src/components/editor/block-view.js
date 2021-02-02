/**
 * WordPress dependencies
 */
import {
	BlockList,
	ObserveTyping,
	WritingFlow,
	__unstableUseBlockSelectionClearer,
} from '@wordpress/block-editor';
import { Spinner } from '@wordpress/components';
import { useRef } from '@wordpress/element';

/**
 * The current navigation rendered in the form of a core Navigation block.
 *
 * @param {Object}  props           Component props.
 * @param {boolean} props.isPending Whether the navigation post has loaded.
 */
export default function BlockView( { isPending } ) {
	const layoutRef = useRef();
	__unstableUseBlockSelectionClearer( layoutRef );

	return (
		<div className="edit-navigation-editor__block-view" ref={ layoutRef }>
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
