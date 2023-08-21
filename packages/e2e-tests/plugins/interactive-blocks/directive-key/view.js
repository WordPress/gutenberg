( ( { wp } ) => {
	const { store, navigate } = wp.interactivity;

	const html = `
		<div data-wp-interactive data-wp-navigation-id="some-id">
			<ul>
				<li data-wp-key="id-1">1</li>
				<li data-wp-key="id-2" data-testid="second-item">2</li>
				<li data-wp-key="id-3">3</li>
			</ul>
		</div>`;

	store( {
		actions: {
			navigate: () => {
				navigate( window.location, {
					force: true,
					html,
				} );
			},
		},
	} );
} )( window );
