/**
 * Internal dependencies
 */
import GridItem from './grid-item';

export default function GridView( { items, ...props } ) {
	if ( ! items?.length ) {
		return null;
	}

	return (
		<ul role="listbox" className="edit-site-media__grid" { ...props }>
			{ items.map( ( item ) => (
				<GridItem key={ item.slug } item={ item } />
			) ) }
		</ul>
	);
}
