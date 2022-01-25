/**
 * Delete all the widgets in the widgets screen.
 *
 * @this {import('./').TestUtils}
 */
export async function deleteAllWidgets() {
	const [ widgets, sidebars ] = await Promise.all( [
		this.__experimentalRest( { path: '/wp/v2/widgets' } ),
		this.__experimentalRest( { path: '/wp/v2/sidebars' } ),
	] );

	await this.__experimentalBatch(
		widgets.map( ( widget ) => ( {
			method: 'DELETE',
			path: `/wp/v2/widgets/${ widget.id }?force=true`,
		} ) )
	);

	await this.__experimentalBatch(
		sidebars.map( ( sidebar ) => ( {
			method: 'POST',
			path: `/wp/v2/sidebars/${ sidebar.id }`,
			body: { id: sidebar.id, widgets: [] },
		} ) )
	);
}
