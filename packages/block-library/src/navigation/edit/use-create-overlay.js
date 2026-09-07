import { useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { parse, serialize, createBlock } from '@wordpress/blocks';
import { getUniqueTemplatePartTitle, getCleanTemplatePartSlug } from './utils';
import { NAVIGATION_OVERLAY_TEMPLATE_PART_AREA } from '../constants';
import { unlock } from '../../lock-unlock';

/**
 * Hook to create a new overlay: a pattern of the overlay area.
 *
 * @param {Array} overlayTemplateParts Existing overlays, to keep the new title unique.
 * @return {function(): Promise<Object>} Function to create a new overlay.
 *                                      The function returns a Promise that resolves to the created overlay.
 */
export default function useCreateOverlayTemplatePart( overlayTemplateParts ) {
	const { saveEntityRecord, invalidateResolution } = useDispatch( coreStore );
	const stylesheet = useSelect(
		( select ) => select( coreStore ).getCurrentTheme()?.stylesheet,
		[]
	);
	const pattern = useSelect(
		( select ) =>
			unlock( select( blockEditorStore ) ).getPatternBySlug(
				'core/navigation-overlay'
			),
		[]
	);

	const createOverlayTemplatePart = useCallback( async () => {
		// Generate unique name using only overlay area template parts
		// Filter to only include template parts with titles for uniqueness check
		const templatePartsWithTitles = overlayTemplateParts.filter(
			( templatePart ) => templatePart.title?.rendered
		);
		const uniqueTitle = getUniqueTemplatePartTitle(
			__( 'Navigation Overlay' ),
			templatePartsWithTitles
		);
		const cleanSlug = getCleanTemplatePartSlug( uniqueTitle );

		let initialContent = '';

		if ( pattern?.content ) {
			// Parse the pattern content into blocks and serialize it
			const blocks = parse( pattern.content, {
				__unstableSkipMigrationLogs: true,
			} );
			initialContent = serialize( blocks );
		} else {
			// Fallback to empty paragraph if pattern is not found
			initialContent = serialize( [ createBlock( 'core/paragraph' ) ] );
		}

		// Create the template part
		// An overlay is the edited copy of a part pattern (`theme/part/slug`)
		// in the overlay area; it is registered from the copy on the next
		// request.
		const name = `${ stylesheet }/part/${ cleanSlug }`;
		const copy = await saveEntityRecord(
			'postType',
			'wp_block',
			{
				title: uniqueTitle,
				content: initialContent,
				status: 'publish',
				meta: {
					wp_pattern_slug: name,
					wp_pattern_area: NAVIGATION_OVERLAY_TEMPLATE_PART_AREA,
				},
			},
			{ throwOnError: true }
		);
		invalidateResolution( 'getBlockPatterns' );
		return {
			id: copy.id,
			slug: cleanSlug,
			name,
			theme: stylesheet,
			title: { rendered: uniqueTitle },
		};
	}, [
		overlayTemplateParts,
		saveEntityRecord,
		invalidateResolution,
		pattern,
		stylesheet,
	] );

	return createOverlayTemplatePart;
}
