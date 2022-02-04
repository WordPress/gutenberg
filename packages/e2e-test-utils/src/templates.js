/**
 * Internal dependencies
 */
import { rest, batch } from './rest-api';

const PATH_MAPPING = {
	wp_template: '/wp/v2/templates',
	wp_template_part: '/wp/v2/template-parts',
};

/**
 * Delete all the templates of given type.
 *
 * @param {('wp_template'|'wp_template_part')} type - Template type to delete.
 */
export async function deleteAllTemplates( type ) {
	const path = PATH_MAPPING[ type ];

	if ( ! path ) {
		return;
	}

	const [ templates ] = await rest( { path } );

	await batch(
		templates
			.filter( ( template ) => !! template.wp_id )
			.map( ( template ) => ( {
				method: 'DELETE',
				path: `/wp/v2/posts/${ template.wp_id }?force=true`,
			} ) )
	);
}
