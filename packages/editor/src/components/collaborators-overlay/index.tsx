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
				/>
			) }
		</BlockCanvasCover.Fill>
	);
}
