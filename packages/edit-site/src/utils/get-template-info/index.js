/**
 * Internal dependencies
 */
import { TEMPLATES_DEFAULT_DETAILS } from './constants';

/**
 * Given a template entity, return information about it which is ready to be
 * rendered, such as the title and description.
 *
 * @param {Object} template The template for which we need information.
 * @return {Object} Information about the template, including title and description.
 */
export default function getTemplateInfo( template ) {
	if ( ! template ) {
		return {};
	}
	const { title: defaultTitle, description: defaultDescription } =
		TEMPLATES_DEFAULT_DETAILS[ template.slug ] ?? {};

	let title = template?.title?.rendered ?? template.slug;
	if ( title !== template.slug ) {
		title = template.title.rendered;
	} else if ( defaultTitle ) {
		title = defaultTitle;
	}

	const description = template?.excerpt?.raw || defaultDescription;
	return { title, description };
}
