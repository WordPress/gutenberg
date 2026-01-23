/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { parse, serialize, createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getUniqueTemplatePartTitle, getCleanTemplatePartSlug } from './utils';
import { NAVIGATION_OVERLAY_TEMPLATE_PART_AREA } from '../constants';
import { unlock } from '../../lock-unlock';

/**
 * Hook to create a new overlay template part.
 *
 * @param {Array} overlayTemplateParts Array of existing overlay template parts.
 * @return {function(): Promise<Object>} Function to create a new overlay template part.
 *                                      The function returns a Promise that resolves to the created template part object.
 */
export default function useCreateOverlayTemplatePart( overlayTemplateParts ) {
	const { saveEntityRecord } = useDispatch( coreStore );
	const pattern = useSelect(
		( select ) =>
			unlock( select( blockEditorStore ) ).getPatternBySlug(
				'gutenberg/navigation-overlay'
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
			__( 'Overlay' ),
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
		const templatePart = await saveEntityRecord(
			'postType',
			'wp_template_part',
			{
				slug: cleanSlug,
				title: uniqueTitle,
				content: initialContent,
				area: NAVIGATION_OVERLAY_TEMPLATE_PART_AREA,
			},
			{ throwOnError: true }
		);

		return templatePart;
	}, [ overlayTemplateParts, saveEntityRecord, pattern ] );

	return createOverlayTemplatePart;
}
