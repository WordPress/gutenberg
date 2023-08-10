/**
 * Internal dependencies
 */
import GridItem from './grid-item';

export default function Grid( { categoryId, items, ...props } ) {
	if ( ! items?.length ) {
		return null;
	}

	return (
		<ul role="listbox" className="edit-site-patterns__grid" { ...props }>
			{ items.map( ( item ) => (
				<GridItem
					key={ item.name }
					item={ item }
					categoryId={ categoryId }
				/>
			) ) }
		</ul>
	);
}
