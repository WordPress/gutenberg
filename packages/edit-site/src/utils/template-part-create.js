/**
 * External dependencies
 */
import { paramCase as kebabCase } from 'change-case';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

export const useExistingTemplateParts = () => {
	return useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords(
				'postType',
				'wp_template_part',
				{
					per_page: -1,
				}
			),
		[]
	);
};

/**
 * Return a unique template part title based on
 * the given title and existing template parts.
 *
 * @param {string} title         The original template part title.
 * @param {Object} templateParts The array of template part entities.
 * @return {string} A unique template part title.
 */
export const getUniqueTemplatePartTitle = ( title, templateParts ) => {
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
};

/**
 * Get a valid slug for a template part.
 * Currently template parts only allow latin chars.
 * The fallback slug will receive suffix by default.
 *
 * @param {string} title The template part title.
 * @return {string} A valid template part slug.
 */
export const getCleanTemplatePartSlug = ( title ) => {
	return kebabCase( title ).replace( /[^\w-]+/g, '' ) || 'wp-custom-part';
};
