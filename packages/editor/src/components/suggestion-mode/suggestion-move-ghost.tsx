import { useSelect } from '@wordpress/data';
// @ts-expect-error No exported types
import { BlockIcon, store as blockEditorStore } from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';
import { VisuallyHidden } from '@wordpress/ui';
import { getAvatarBorderColor } from '../collab-sidebar/utils';
import type { MovedBlockDescriptor } from './move-ghost-index';

/**
 * Extract a short plain-text excerpt from a block's primary text attribute.
 * `content` may be a string or a RichText value; both expose a string form.
 *
 * @param content Raw `content` attribute.
 * @return Tag-stripped, trimmed, length-capped excerpt.
 */
function toExcerpt( content: any ): string {
	let raw = '';
	if ( typeof content === 'string' ) {
		raw = content;
	} else if ( content && typeof content.toString === 'function' ) {
		raw = content.toString();
	}
	return raw
		.replace( /<[^>]+>/g, '' )
		.replace( /\s+/g, ' ' )
		.trim()
		.slice( 0, 120 );
}

/**
 * Non-interactive "ghost" placeholder rendered at a moved block's original
 * position so a reviewer can see where the block came from. Never
 * selectable/focusable, never part of the block list, never written to the
 * store. Styling lives in the canvas-loaded `content-suggestion.scss`
 * (block-editor package).
 *
 * Accessibility: the visible label, icon, and excerpt are decorative
 * duplicates of the canvas treatment and are hidden from assistive tech; a
 * single `role="note"` with a `VisuallyHidden` sentence carries the
 * original-position cue so screen-reader users get it once, without the
 * struck-through old content reading as live text.
 *
 * @param props       Props.
 * @param props.moved The moved-block descriptor.
 * @return The ghost element.
 */
export default function SuggestionMoveGhost( {
	moved,
}: {
	moved: MovedBlockDescriptor;
} ) {
	const blockType = getBlockType( moved.name );
	const title = blockType?.title ?? moved.name;

	const excerpt = useSelect(
		( select ) => {
			const attrs =
				select( blockEditorStore ).getBlockAttributes(
					moved.clientId
				) ?? {};
			return toExcerpt( attrs.content );
		},
		[ moved.clientId ]
	);

	const style =
		moved.authorId !== null && moved.authorId !== undefined
			? {
					'--suggestion-author-color': getAvatarBorderColor(
						moved.authorId
					),
			  }
			: undefined;

	return (
		<div
			className="is-suggestion-move-ghost"
			data-testid="suggestion-move-ghost"
			style={ style }
			role="note"
			contentEditable={ false }
		>
			<VisuallyHidden>
				{ sprintf(
					/* translators: %s: block type title. */
					__( 'Original position of moved %s block.' ),
					title
				) }
			</VisuallyHidden>
			<span
				className="is-suggestion-move-ghost__label"
				aria-hidden="true"
			>
				<BlockIcon icon={ blockType?.icon } />
				{ sprintf(
					/* translators: %s: block type title. */
					__( 'Moved from here: %s' ),
					title
				) }
			</span>
			{ excerpt && (
				<span
					className="is-suggestion-move-ghost__excerpt"
					aria-hidden="true"
				>
					{ excerpt }
				</span>
			) }
		</div>
	);
}
