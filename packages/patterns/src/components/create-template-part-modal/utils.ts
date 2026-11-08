import { paramCase as kebabCase } from 'change-case';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { WpTemplatePart } from '@wordpress/core-data';

const EMPTY_ARRAY: WpTemplatePart[] = [];

export function useExistingTemplateParts(): WpTemplatePart[] {
	return useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords< WpTemplatePart >(
				'postType',
				'wp_template_part',
				{ per_page: -1 }
			) ?? EMPTY_ARRAY,
		[]
	);
}

/**
 * Return a unique template part title based on
 * the given title and existing template parts.
 *
 * @param title         The original template part title.
 * @param templateParts The array of template part entities.
 * @return A unique template part title.
 */
export function getUniqueTemplatePartTitle(
	title: string,
	templateParts: WpTemplatePart[]
): string {
	const lowercaseTitle = title.toLowerCase();
	const existingTitles = templateParts.map( ( templatePart ) =>
		templatePart.title.rendered.toLowerCase()
	);

	if ( ! existingTitles.includes( lowercaseTitle ) ) {
		return title;
	}

	let suffix = 2;
	while ( existingTitles.includes( `${ lowercaseTitle } ${ suffix }` ) ) {
		suffix++;
	}

	return `${ title } ${ suffix }`;
}

/**
 * Get a valid slug for a template part.
 * Currently template parts only allow latin chars.
 * The fallback slug will receive suffix by default.
 *
 * @param title The template part title.
 * @return A valid template part slug.
 */
export function getCleanTemplatePartSlug( title: string ): string {
	return kebabCase( title ).replace( /[^\w-]+/g, '' ) || 'wp-custom-part';
}
