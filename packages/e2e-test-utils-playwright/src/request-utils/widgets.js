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

	// The endpoint doesn't support batch requests yet.
	await Promise.all(
		sidebars.map( ( sidebar ) =>
			this.rest( {
				method: 'POST',
				path: `/wp/v2/sidebars/${ sidebar.id }`,
				data: { id: sidebar.id, widgets: [] },
			} )
		)
	);
}

/**
 * Add a widget block to the widget area.
 *
 * @this {import('./index').RequestUtils}
 * @param {string} serializedBlock The serialized content of the inserted block HTML.
 * @param {string} widgetAreaId    The ID of the widget area.
 */
export async function addWidgetBlock( serializedBlock, widgetAreaId ) {
	const { id: blockId } = await this.rest( {
		method: 'POST',
		path: '/wp/v2/widgets',
		data: {
			id_base: 'block',
			sidebar: widgetAreaId,
			instance: {
				raw: { content: serializedBlock },
			},
		},
	} );

	const { widgets } = await this.rest( {
		path: `/wp/v2/sidebars/${ widgetAreaId }`,
	} );

	const updatedWidgets = new Set( widgets );
	// Remove duplicate.
	updatedWidgets.delete( blockId );
	// Add to last block.
	updatedWidgets.add( blockId );

	await this.rest( {
		method: 'PUT',
		path: `/wp/v2/sidebars/${ widgetAreaId }`,
		data: {
			widgets: [ ...updatedWidgets ],
		},
	} );
}
