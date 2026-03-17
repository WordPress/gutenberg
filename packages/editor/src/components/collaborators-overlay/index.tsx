/**
 * WordPress dependencies
 */
// @ts-expect-error No exported types
import { privateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { Overlay } from './overlay';
import { type CursorRegistry } from './cursor-registry';

const { BlockCanvasCover } = unlock( privateApis );

interface Props {
	postId: number | null;
	postType: string | null;
	cursorRegistry?: CursorRegistry;
}

/**
 * Collaborators Overlay component
 * @param props                - The props for the CollaboratorsOverlay component
 * @param props.postId         - The ID of the post
 * @param props.postType       - The type of the post
 * @param props.cursorRegistry - The shared cursor registry
 * @return The CollaboratorsOverlay component
 */
export function CollaboratorsOverlay( {
	postId,
	postType,
	cursorRegistry,
}: Props ) {
	return (
		<BlockCanvasCover.Fill>
			{ ( {
				containerRef,
			}: {
				containerRef: React.MutableRefObject< HTMLElement | null >;
			} ) => (
				<Overlay
					blockEditorDocument={ containerRef.current?.ownerDocument }
					postId={ postId }
					postType={ postType }
					cursorRegistry={ cursorRegistry }
				/>
			) }
		</BlockCanvasCover.Fill>
	);
}
