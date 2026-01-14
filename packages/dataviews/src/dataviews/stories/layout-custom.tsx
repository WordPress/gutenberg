/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataViews from '../index';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import type { View } from '../../types';
import { data, fields } from './fixtures';
import { LAYOUT_TABLE } from '../../constants';

/**
 * Poster/hero style layout that displays items as large image cards
 * with overlaid text content.
 */
function PosterGrid( { items }: { items: typeof data } ) {
	return (
		<div
			style={ {
				display: 'grid',
				gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
				gap: '16px',
				padding: '16px 0',
			} }
		>
			{ items.map( ( item ) => (
				<div
					key={ item.id }
					style={ {
						position: 'relative',
						aspectRatio: '4 / 3',
						borderRadius: '8px',
						overflow: 'hidden',
						backgroundImage: `url(${ item.image })`,
						backgroundSize: 'cover',
						backgroundPosition: 'center',
					} }
				>
					<div
						style={ {
							position: 'absolute',
							bottom: 0,
							left: 0,
							right: 0,
							padding: '48px 16px 16px',
							background:
								'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
							color: 'white',
						} }
					>
						<h3
							style={ {
								margin: '0 0 4px',
								fontSize: '18px',
								fontWeight: 600,
								textShadow: '0 1px 2px rgba(0,0,0,0.5)',
							} }
						>
							{ item.name.title }
						</h3>
						<p
							style={ {
								margin: '0 0 8px',
								fontSize: '13px',
								opacity: 0.9,
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
							} }
						>
							{ item.name.description }
						</p>
						<div style={ { display: 'flex', gap: '6px' } }>
							{ item.categories.slice( 0, 2 ).map( ( cat ) => (
								<span
									key={ cat }
									style={ {
										fontSize: '11px',
										padding: '2px 8px',
										borderRadius: '4px',
										backgroundColor:
											'rgba(255,255,255,0.2)',
									} }
								>
									{ cat }
								</span>
							) ) }
						</div>
					</div>
				</div>
			) ) }
		</div>
	);
}

/**
 * Demonstrates a custom poster/hero layout using free composition.
 *
 * This story shows how to:
 * - Use `<DataViews>` as a context provider with custom children
 * - Render a completely custom layout (poster grid) instead of `<DataViews.Layout />`
 * - Still leverage DataViews sub-components for search and pagination
 */
export const LayoutCustomComponent = () => {
	const [ view, setView ] = useState< View >( {
		type: LAYOUT_TABLE,
		search: '',
		page: 1,
		perPage: 6,
		filters: [],
		fields: [],
	} );

	const { data: processedData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ view ] );

	return (
		<DataViews
			getItemId={ ( item ) => item.id.toString() }
			paginationInfo={ paginationInfo }
			data={ processedData }
			view={ view }
			fields={ fields }
			onChangeView={ setView }
			defaultLayouts={ { table: {} } }
		>
			<div style={ { padding: '2px' } }>
				<DataViews.Search />
				<PosterGrid items={ processedData } />
				<DataViews.Pagination />
			</div>
		</DataViews>
	);
};

export default LayoutCustomComponent;
