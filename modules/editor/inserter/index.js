const h = wp.element.createElement;

const Inserter = () => {
	const blocks = wp.blocks.getBlocks();

	return h( 'div', { className: 'inserter' },
		h( 'div', { className: 'inserter__arrow' } ),
		h( 'div', { className: 'inserter__content' },
			h( 'div', { className: 'inserter__category-blocks' },
				blocks.map( ( { slug, title, icon } ) => (
					h( 'div', { key: slug, className: 'inserter__block' },
						h( 'span', { className: 'dashicons dashicons-' + icon } ),
						title
					)
				) )
			)
		),
		h( 'input', { className: 'inserter__search', type: 'search', placeholder: 'Search...' } )
	);
};

export default Inserter;
