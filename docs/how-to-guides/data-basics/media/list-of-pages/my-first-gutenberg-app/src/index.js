const wp = window.wp;
const { SearchControl, Spinner } = wp.components;

function MyFirstApp() {
	const [ searchTerm, setSearchTerm ] = wp.element.useState( '' );
	const { pages, hasResolved } = wp.data.useSelect(
		( select ) => {
			const query = {};
			if ( searchTerm ) {
				query.search = searchTerm;
			}
			const selectorArgs = [ 'postType', 'page', query ];
			return {
				pages: select( wp.coreData.store ).getEntityRecords(
					...selectorArgs
				),
				hasResolved: select( wp.coreData.store ).hasFinishedResolution(
					'getEntityRecords',
					selectorArgs
				),
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
