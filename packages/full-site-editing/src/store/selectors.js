/**
 * External dependencies
 */
import { find, isString } from 'lodash';
import createSelector from 'rememo';

/**
 * Returns the default template types.
 *
 * @param {Object} state Global application state.
 *
 * @return {Object} The template types.
 */
export function __experimentalGetDefaultTemplateTypes( state ) {
	return state?.defaultTemplateTypes;
}

/**
 * Returns a default template type searched by slug.
 *
 * @param {Object} state Global application state.
 * @param {string} slug The template type slug.
 *
 * @return {Object} The template type.
 */
export const __experimentalGetDefaultTemplateType = createSelector(
	( state, slug ) =>
		find( __experimentalGetDefaultTemplateTypes( state ), { slug } ) || {},
	( state, slug ) => [ __experimentalGetDefaultTemplateTypes( state ), slug ]
);

/**
 * Given a template entity, return information about it which is ready to be
 * rendered, such as the title and description.
 *
 * @param {Object} state Global application state.
 * @param {Object} template The template for which we need information.
 * @return {Object} Information about the template, including title and description.
 */
export function __experimentalGetTemplateInfo( state, template ) {
	if ( ! template ) {
		return {};
	}

	const { excerpt, slug, title } = template;
	const {
		title: defaultTitle,
		description: defaultDescription,
	} = __experimentalGetDefaultTemplateType( state, slug );

	const templateTitle = isString( title ) ? title : title?.rendered;
	const templateDescription = isString( excerpt ) ? excerpt : excerpt?.raw;

	return {
		title:
			templateTitle && templateTitle !== slug
				? templateTitle
				: defaultTitle || slug,
		description: templateDescription || defaultDescription,
	};
}
