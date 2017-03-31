function Inserter() {
	const blocks = wp.blocks.getBlocks();

	return (
		<div className="inserter">
			<div className="inserter__arrow" />
			<div className="inserter__content">
				<div className="inserter__Category-blocks">
					{ blocks.map( ( { slug, title, icon } ) => (
						<div key={ slug } className="inserter__block">
							<span className={ 'dashicons dashicons-' + icon } />
							{ title }
						</div>
					) ) }
				</div>
			</div>
			<input className="inserter__search" type="search" placeholder="Search..." />
		</div>
	);
}

export default Inserter;
