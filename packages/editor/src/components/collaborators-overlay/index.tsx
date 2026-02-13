import { privateApis } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import { unlock } from '../../lock-unlock';
import { CursorRegistry } from './cursor-registry';
import { Overlay } from './overlay';

const { BlockCanvasCover } = unlock( privateApis );

interface Props {
	postId: number | null;
	postType: string | null;
}

/**
 * Collaborators Overlay component
 * @param props          - The props for the CollaboratorsOverlay component
 * @param props.postId   - The ID of the post
 * @param props.postType - The type of the post
 * @return The CollaboratorsOverlay component
 */
export function CollaboratorsOverlay( { postId, postType }: Props ) {
	// A single instance of the cursor registry is shared between CollaboratorsPresence
	// and CollaboratorsOverlay. A ref is used to persist the instance across re-renders.
	const [ cursorRegistry ] = useState< CursorRegistry >(
		() => new CursorRegistry()
	);

	return (
		BlockCanvasCover?.Fill && (
			<BlockCanvasCover.Fill>
				{ ( {
					containerRef,
				}: {
					containerRef: React.MutableRefObject< HTMLElement | null >;
				} ) => (
					<Overlay
						blockEditorDocument={
							containerRef.current?.ownerDocument
						}
						cursorRegistry={ cursorRegistry }
						postId={ postId }
						postType={ postType }
					/>
				) }
			</BlockCanvasCover.Fill>
		)
	);
}
