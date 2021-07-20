/**
 * Internal dependencies
 */
import { rest } from './rest-api';

/**
 * Delete all the widgets in the widgets screen.
 */
export async function deleteAllWidgets() {
	const [ widgets, sidebars ] = await Promise.all( [
		rest( { path: '/wp/v2/widgets' } ),
		rest( { path: '/wp/v2/sidebars' } ),
	] );

	await rest( {
		method: 'POST',
		path: '/batch/v1',
		data: {
			requests: widgets.map( ( widget ) => ( {
				method: 'DELETE',
				path: `/wp/v2/widgets/${ widget.id }?force=true`,
			} ) ),
			validation: 'require-all-validate',
		},
	} );

	await Promise.all(
		sidebars.map( ( sidebar ) =>
			rest( {
				method: 'POST',
				path: `/wp/v2/sidebars/${ sidebar.id }`,
				data: { id: sidebar.id, widgets: [] },
			} )
		)
	);
}
