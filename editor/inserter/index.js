function Inserter() {
	const blocks = wp.blocks.getBlocks();
	const blocksByCategory = blocks.reduce( ( groups, block ) => {
		if ( ! groups[ block.category ] ) {
			groups[ block.category ] = [];
		}
		groups[ block.category ].push( block );
		return groups;
	}, {} );
	const categories = wp.blocks.getCategories();

	return (
		<div className="inserter">
			<div className="inserter__arrow" />
			<div className="inserter__content">
				{ categories
					.map( ( category ) => !! blocksByCategory[ category.slug ] && (
						<div key={ category.slug }>
							<div className="inserter__separator">{ category.title }</div>
							<div className="inserter__category-blocks">
								{ blocksByCategory[ category.slug ].map( ( { slug, title, icon } ) => (
									<div key={ slug } className="inserter__block">
										<span className={ 'dashicons dashicons-' + icon } />
										{ title }
									</div>
								) ) }
							</div>
						</div>
					) )
				}
			</div>
			<input className="inserter__search" type="search" placeholder="Search..." />
		</div>
	);
}

export default Inserter;
