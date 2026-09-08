import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { parse } from '@wordpress/blocks';
import { BlockPreview } from '@wordpress/block-editor';
import { store as patternsStore } from '@wordpress/patterns';
import { unlock } from '../../lock-unlock';
import useOverlayPatterns from './use-overlay-patterns';

const EMPTY_OBJECT = {};

/**
 * Component that displays a read-only visual preview of the selected overlay:
 * a user pattern, or a registered pattern of the overlay area through its
 * customization when it has one.
 *
 * @param {Object} props         Component props.
 * @param {string} props.overlay The overlay slug.
 * @return {React.JSX.Element} The overlay preview component or null if no overlay is selected.
 */
export default function OverlayPreview( { overlay } ) {
	const { overlays, hasResolved } = useOverlayPatterns();
	const entry = useMemo(
		() =>
			overlay
				? overlays.find( ( candidate ) => candidate.slug === overlay )
				: undefined,
		[ overlays, overlay ]
	);

	const { content, editedBlocks } = useSelect(
		( select ) => {
			if ( ! entry ) {
				return EMPTY_OBJECT;
			}
			const recordId = entry.isUser
				? entry.id
				: unlock( select( patternsStore ) ).getPatternCustomization(
						entry.name
				  )?.id;
			if ( recordId ) {
				const record = select( coreStore ).getEditedEntityRecord(
					'postType',
					'wp_block',
					recordId
				);
				return {
					content: record?.content,
					editedBlocks: record?.blocks,
				};
			}
			return { content: entry.pattern?.content };
		},
		[ entry ]
	);

	const blocks = useMemo( () => {
		if ( ! entry ) {
			return null;
		}
		if ( editedBlocks && editedBlocks.length > 0 ) {
			return editedBlocks;
		}
		if ( content && typeof content === 'string' ) {
			return parse( content );
		}
		return [];
	}, [ entry, editedBlocks, content ] );

	if ( ! overlay ) {
		return null;
	}

	if ( ! entry && ! hasResolved ) {
		return (
			<div className="wp-block-navigation__overlay-preview-loading">
				{ null }
			</div>
		);
	}

	return (
		<div className="wp-block-navigation__overlay-preview">
			{ blocks && blocks.length > 0 ? (
				<BlockPreview blocks={ blocks } viewportWidth={ 400 } />
			) : (
				<div className="wp-block-navigation__overlay-preview-placeholder" />
			) }
		</div>
	);
}
