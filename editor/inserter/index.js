const el = wp.element.createElement;

const Inserter = () => {
	const blocks = wp.blocks.getBlocks();

	return el( 'div', { className: 'inserter' },
		el( 'div', { className: 'inserter__arrow' } ),
		el( 'div', { className: 'inserter__content' },
			el( 'div', { className: 'inserter__category-blocks' },
				blocks.map( ( { slug, title, icon } ) => (
					el( 'div', { key: slug, className: 'inserter__block' },
						el( 'span', { className: 'dashicons dashicons-' + icon } ),
						title
					)
				) )
			)
		),
		el( 'input', { className: 'inserter__search', type: 'search', placeholder: 'Search...' } )
	);
};

export default Inserter;
