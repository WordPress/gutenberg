import { useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { parse, serialize, createBlock } from '@wordpress/blocks';
import { getUniqueTemplatePartTitle } from './utils';
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
	const { saveEntityRecord } = useDispatch( coreStore );
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
		// An overlay is a user pattern filed under the overlay area; the
		// Navigation block references it by its slug.
		const overlayPattern = await saveEntityRecord(
			'postType',
			'wp_block',
			{
				title: uniqueTitle,
				content: initialContent,
				status: 'publish',
				meta: {
					wp_pattern_area: NAVIGATION_OVERLAY_TEMPLATE_PART_AREA,
				},
			},
			{ throwOnError: true }
		);
		return {
			id: overlayPattern.id,
			slug: overlayPattern.slug,
			title: { rendered: uniqueTitle },
			isUser: true,
		};
	}, [ overlayTemplateParts, saveEntityRecord, pattern ] );

	return createOverlayTemplatePart;
}
