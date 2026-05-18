/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { BlockIcon, store as blockEditorStore } from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getAvatarBorderColor } from '../collab-sidebar/utils';

/**
 * Extract a short plain-text excerpt from a block's primary text attribute.
 * `content` may be a string or a RichText value; both expose a string form.
 *
 * @param {*} content Raw `content` attribute.
 * @return {string} Tag-stripped, trimmed, length-capped excerpt.
 */
function toExcerpt( content ) {
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
 * position so a reviewer can see where the block came from. Purely
 * presentational — never selectable/focusable, never part of the block list,
 * never written to the store. Styling lives in the canvas-loaded
 * `content-suggestion.scss` (block-editor package).
 *
 * @param {Object}                                            props       Props.
 * @param {import('./move-ghost-index').MovedBlockDescriptor} props.moved The
 *                                                                        moved-block
 *                                                                        descriptor.
 * @return {JSX.Element} The ghost element.
 */
export default function SuggestionMoveGhost( { moved } ) {
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
			aria-hidden="true"
			contentEditable={ false }
		>
			<span className="is-suggestion-move-ghost__label">
				<BlockIcon icon={ blockType?.icon } />
				{ sprintf(
					/* translators: %s: block type title. */
					__( 'Moved from here: %s' ),
					title
				) }
			</span>
			{ excerpt && (
				<span className="is-suggestion-move-ghost__excerpt">
					{ excerpt }
				</span>
			) }
		</div>
	);
}
