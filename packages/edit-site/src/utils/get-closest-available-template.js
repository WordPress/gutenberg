/**
 * External dependencies
 */
import { find } from 'lodash';

export default function getClosestAvailableTemplate( slug, templates ) {
	if ( 'front-page' === slug ) {
		const homeTemplate = find( templates, { slug: 'home' } );
		if ( homeTemplate ) {
			return homeTemplate;
		}
	}

	if ( 'single' === slug || 'page' === slug ) {
		const singularTemplate = find( templates, { slug: 'singular' } );
		if ( singularTemplate ) {
			return singularTemplate;
		}
	}

	const indexTemplate = find( templates, { slug: 'index' } );
	return indexTemplate;
}
