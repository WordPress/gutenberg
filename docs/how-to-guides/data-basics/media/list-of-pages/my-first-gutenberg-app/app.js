const { SearchControl, Spinner } = window.wp.components;

function MyFirstApp() {
	const [ searchTerm, setSearchTerm ] = window.wp.element.useState( '' );
	const { pages, hasResolved } = window.wp.data.useSelect(
		( select ) => {
			const query = {};
			if ( searchTerm ) {
				query.search = searchTerm;
			}
			return {
				pages: select( window.wp.coreData.store ).getEntityRecords(
					'postType',
					'page',
					query
				),
				hasResolved: select(
					window.wp.coreData.store
				).hasFinishedResolution( 'getEntityRecords', [
					'postType',
					'page',
					query,
				] ),
			};
		},
		[ searchTerm ]
	);

	return (
		<div>
			<SearchControl onChange={ setSearchTerm } value={ searchTerm } />
			<PagesList hasResolved={ hasResolved } pages={ pages } />
		</div>
	);
}

function PagesList( { hasResolved, pages } ) {
	if ( ! hasResolved ) {
		return <Spinner />;
	}
	if ( ! pages?.length ) {
		return <div>No results</div>;
	}

	return (
		<table className="wp-list-table widefat fixed striped table-view-list">
			<thead>
				<tr>
					<td>Title</td>
				</tr>
			</thead>
			<tbody>
				{ pages?.map( ( page ) => (
					<tr key={ page.id }>
						<td>{ page.title.rendered }</td>
					</tr>
				) ) }
			</tbody>
		</table>
	);
}

window.addEventListener(
	'load',
	function () {
		window.wp.element.render(
			window.wp.element.createElement( MyFirstApp ),
			document.querySelector( '#my-first-gutenberg-app' )
		);
	},
	false
);
