/**
 * Internal dependencies
 */
import './style.scss';
import Dashicon from 'components/dashicon';

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
		<div className="editor-inserter">
			<div className="editor-inserter__arrow" />
			<div className="editor-inserter__content">
				{ categories
					.map( ( category ) => !! blocksByCategory[ category.slug ] && (
						<div key={ category.slug }>
							<div className="editor-inserter__separator">{ category.title }</div>
							<div className="editor-inserter__category-blocks">
								{ blocksByCategory[ category.slug ].map( ( { slug, title, icon } ) => (
									<div key={ slug } className="editor-inserter__block">
										<Dashicon icon={ icon } />
										{ title }
									</div>
								) ) }
							</div>
						</div>
					) )
				}
			</div>
			<input
				type="search"
				placeholder={ wp.i18n.__( 'Search…' ) }
				className="editor-inserter__search" />
		</div>
	);
}

export default Inserter;
