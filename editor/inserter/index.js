/**
 * External dependencies
 */
import { groupBy } from 'lodash';

function Inserter() {
	const blocks = wp.blocks.getBlocks();
	const blocksByCategory = groupBy( blocks, 'category' );
	const categories = wp.blocks.getCategories();

	return (
		<div className="inserter">
			<div className="inserter__arrow" />
			<div className="inserter__content">
				{ categories
					.filter( ( category ) => !! blocksByCategory[ category.id ] )
					.map( ( category ) =>
						<div key={ category.id } className="inserter__Category-blocks">
							<div className="inserter__separator">{ category.label }</div>
							{ blocksByCategory[ category.id ].map( ( { slug, title, icon } ) => (
								<div key={ slug } className="inserter__block">
									<span className={ 'dashicons dashicons-' + icon } />
									{ title }
								</div>
							) ) }
						</div>
					)
				}
			</div>
			<input className="inserter__search" type="search" placeholder="Search..." />
		</div>
	);
}

export default Inserter;
