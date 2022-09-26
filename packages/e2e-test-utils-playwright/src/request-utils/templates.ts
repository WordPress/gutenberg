/**
 * Internal dependencies
 */
import type { RequestUtils } from './index';

type TemplateType = 'wp_template' | 'wp_template_part';

interface Template {
	wp_id: number;
	id: string;
}

const PATH_MAPPING = {
	wp_template: '/wp/v2/templates',
	wp_template_part: '/wp/v2/template-parts',
};

/**
 * Delete all the templates of given type.
 *
 * @param  this
 * @param  type - Template type to delete.
 */
async function deleteAllTemplates( this: RequestUtils, type: TemplateType ) {
	const path = PATH_MAPPING[ type ];

	if ( ! path ) {
		throw new Error( `Unsupported template type: ${ type }.` );
	}

	const templates = await this.rest< Template[] >( { path } );

	for ( const template of templates ) {
		if ( ! template?.id || ! template?.wp_id ) {
			continue;
		}

		let response;

		try {
			response = await this.rest( {
				method: 'DELETE',
				path: `${ path }/${ template.id }`,
				params: { force: true },
			} );
		} catch ( responseError ) {
			// Disable reason - the error provides valuable feedback about issues with tests.
			// eslint-disable-next-line no-console
			console.warn(
				`deleteAllTemplates failed to delete template (id: ${ template.wp_id }) with the following error`,
				responseError
			);
		}

		if ( ! response.deleted ) {
			// Disable reason - the error provides valuable feedback about issues with tests.
			// eslint-disable-next-line no-console
			console.warn(
				`deleteAllTemplates failed to delete template (id: ${ template.wp_id }) with the following response`,
				response
			);
		}
	}
}

export { deleteAllTemplates };
