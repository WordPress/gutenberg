/**
 * Internal dependencies
 */
import { TEMPLATES_DEFAULT_DETAILS } from './constants';

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

	const description = template?.excerpt?.rendered || defaultDescription;
	return { title, description };
}
