import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { parse } from '@wordpress/blocks';
import {
	BlockPreview,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { store as patternsStore } from '@wordpress/patterns';
import { unlock } from '../../lock-unlock';
import { getOverlayPatternName } from './use-overlay-patterns';

/**
 * Component that displays a read-only visual preview of the selected overlay.
 *
 * The overlay is a pattern of the `navigation-overlay` area: its edited copy
 * (a `wp_block` post) when there is one, else the registered pattern.
 *
 * @param {Object} props              Component props.
 * @param {string} props.overlay      The overlay slug.
 * @param {string} props.currentTheme The active theme's stylesheet.
 * @return {React.JSX.Element} The overlay preview component or null if no overlay is selected.
 */
export default function OverlayPreview( { overlay, currentTheme } ) {
	const patternName = useMemo(
		() =>
			overlay && currentTheme
				? getOverlayPatternName( currentTheme, overlay )
				: null,
		[ currentTheme, overlay ]
	);

	const { content, editedBlocks, hasResolved } = useSelect(
		( select ) => {
			if ( ! patternName ) {
				return { content: null, editedBlocks: null, hasResolved: true };
			}
			const copy = unlock( select( patternsStore ) ).getPatternOverride(
				patternName
			);
			if ( copy ) {
				const editedRecord = select( coreStore ).getEditedEntityRecord(
					'postType',
					'wp_block',
					copy.id
				);
				return {
					content: editedRecord?.content,
					editedBlocks: editedRecord?.blocks,
					hasResolved: true,
				};
			}
			const pattern = unlock(
				select( blockEditorStore )
			).getPatternBySlug( patternName );
			return {
				content: pattern?.content,
				editedBlocks: null,
				hasResolved:
					!! pattern ||
					select( coreStore ).hasFinishedResolution(
						'getBlockPatterns'
					),
			};
		},
		[ patternName ]
	);

	const blocks = useMemo( () => {
		if ( ! patternName ) {
			return null;
		}
		if ( editedBlocks && editedBlocks.length > 0 ) {
			return editedBlocks;
		}
		if ( content && typeof content === 'string' ) {
			return parse( content );
		}
		return [];
	}, [ patternName, editedBlocks, content ] );

	if ( ! overlay ) {
		return null;
	}

	if ( ! hasResolved ) {
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
