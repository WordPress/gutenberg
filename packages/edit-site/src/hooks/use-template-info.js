/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Given a template entity, return information about it which is ready to be
 * rendered, such as the title and description.
 *
 * @param {Object} template The template for which we need information.
 * @return {Object} Information about the template, including title and description.
 */
export default function useTemplateInfo( template ) {
	const templateTitle = template?.title?.rendered;
	const templateSlug = template?.slug;

	const { defaultTitle, defaultDescription } = useSelect(
		( select ) => {
			const { title, description } = select(
				'core/edit-site'
			).getDefaultTemplateType( templateSlug );
			return { defaultTitle: title, defaultDescription: description };
		},
		[ templateSlug ]
	);

	if ( ! template ) {
		return {};
	}

	const title =
		templateTitle && templateTitle !== templateSlug
			? templateTitle
			: defaultTitle || templateSlug;
	const description = template?.excerpt?.raw || defaultDescription;
	return { title, description };
}
