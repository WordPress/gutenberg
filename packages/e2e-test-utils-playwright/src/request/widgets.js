/**
 * Delete all the widgets in the widgets screen.
 *
 * @this {import('./index').RequestUtils}
 */
export async function deleteAllWidgets() {
	const [ widgets, sidebars ] = await Promise.all( [
		this.rest( { path: '/wp/v2/widgets' } ),
		this.rest( { path: '/wp/v2/sidebars' } ),
	] );

	await this.batchRest(
		widgets.map( ( widget ) => ( {
			method: 'DELETE',
			path: `/wp/v2/widgets/${ widget.id }?force=true`,
		} ) )
	);

	await this.batchRest(
		sidebars.map( ( sidebar ) => ( {
			method: 'POST',
			path: `/wp/v2/sidebars/${ sidebar.id }`,
			body: { id: sidebar.id, widgets: [] },
		} ) )
	);
}
