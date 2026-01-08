/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getUniqueTemplatePartTitle, getCleanTemplatePartSlug } from './utils';

/**
 * Hook to create a new overlay template part.
 *
 * @param {Array} overlayTemplateParts Array of existing overlay template parts.
 * @return {function(): Promise<Object>} Function to create a new overlay template part.
 *                                      The function returns a Promise that resolves to the created template part object.
 */
export default function useCreateOverlayTemplatePart( overlayTemplateParts ) {
	const { saveEntityRecord } = useDispatch( coreStore );

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

		// Create the template part
		const templatePart = await saveEntityRecord(
			'postType',
			'wp_template_part',
			{
				slug: cleanSlug,
				title: uniqueTitle,
				area: 'overlay',
			},
			{ throwOnError: true }
		);

		return templatePart;
	}, [ overlayTemplateParts, saveEntityRecord ] );

	return createOverlayTemplatePart;
}
