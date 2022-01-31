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

	return window.wp.element.createElement(
		'div',
		{},
		window.wp.element.createElement( window.wp.components.SearchControl, {
			onChange: setSearchTerm,
			value: searchTerm,
		} ),
		window.wp.element.createElement( PagesList, { hasResolved, pages } )
	);
}

function PagesList( { hasResolved, pages } ) {
	if ( ! hasResolved ) {
		return window.wp.element.createElement( window.wp.components.Spinner );
	}
	if ( ! pages?.length ) {
		return window.wp.element.createElement( 'div', {}, 'No results' );
	}

	return window.wp.element.createElement(
		'table',
		{
			className:
				'wp-list-table widefat fixed striped table-view-list posts',
		},
		window.wp.element.createElement(
			'thead',
			{},
			window.wp.element.createElement(
				'tr',
				{},
				window.wp.element.createElement( 'td', {}, 'Title' )
			)
		),
		window.wp.element.createElement(
			'tbody',
			{},
			pages?.map( ( page ) =>
				window.wp.element.createElement(
					'tr',
					{ key: page.id },
					window.wp.element.createElement(
						'td',
						{},
						page.title.rendered
					)
				)
			)
		)
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
