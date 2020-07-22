/**
 * Internal dependencies
 */
import Button from '../button';

const Item = ( { data, item, setActive, isActive } ) => {
	const onSelect = () => {
		const children = data.filter( ( d ) => d.parent === item.slug );
		if ( children.length ) {
			setActive( children[ 0 ] );
		} else {
			setActive( item );
		}
	};
	return (
		<Button isSecondary={ isActive } onClick={ onSelect } key={ item.slug }>
			{ item.title }
		</Button>
	);
};

export default Item;
