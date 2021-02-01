/**
 * WordPress dependencies
 */
import { BlockList, ObserveTyping, WritingFlow } from '@wordpress/block-editor';
import { Spinner } from '@wordpress/components';

/**
 * The current navigation rendered in the form of a core Navigation block.
 *
 * @param {Object}  props           Component props.
 * @param {boolean} props.isPending Whether the navigation post has loaded.
 */

export default function Editor( { isPending } ) {
	return (
		<div className="edit-navigation-editor">
			{ isPending ? (
				<Spinner />
			) : (
				// Do we need this div?
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
