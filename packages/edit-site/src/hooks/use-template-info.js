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
	const { defaultTitle, defaultDescription } = useSelect(
		( select ) => {
			const { title, description } = select(
				'core/edit-site'
			).getDefaultTemplateType( template?.slug );
			return { defaultTitle: title, defaultDescription: description };
		},
		[ template?.slug ]
	);

	if ( ! template ) {
		return {};
	}

	const title = template?.title?.rendered || defaultTitle || template.slug;
	const description = template?.excerpt?.raw || defaultDescription;
	return { title, description };
}
