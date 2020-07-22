/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../button';
import Text from '../text';
import Item from './item';

const Navigation = ( { data, initial } ) => {
	const initialActive = data.find( ( item ) => item.slug === initial );
	const [ active, setActive ] = useState( initialActive );
	const parent = data.find( ( item ) => item.slug === active.parent );
	const items = data.filter( ( item ) => item.parent === active.parent );

	const goBack = () => {
		const parentalSiblings = data.filter(
			( item ) => item.parent === parent.parent
		);
		setActive( parentalSiblings[ 0 ] );
	};

	return (
		<>
			<Button onClick={ goBack } isPrimary>
				{ parent.back }
			</Button>
			<Text variant="title.large">{ parent.title }</Text>
			{ items.map( ( item ) => (
				<Item
					key={ item.slug }
					data={ data }
					item={ item }
					setActive={ setActive }
					isActive={ item.slug === active.slug }
				/>
			) ) }
		</>
	);
};

export default Navigation;
