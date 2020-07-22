/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { Icon, arrowLeft } from '@wordpress/icons';

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
		if ( ! parent.parent ) {
			// We are at top level, will need to handle this case.
			return;
		}
		const parentalSiblings = data.filter(
			( item ) => item.parent === parent.parent
		);
		if ( parentalSiblings.length ) {
			setActive( parentalSiblings[ 0 ] );
		}
	};

	return (
		<div className="components-navigation">
			<Button className="components-navigation-back" onClick={ goBack }>
				<Icon icon={ arrowLeft } />
				{ parent.back }
			</Button>
			<div className="components-navigation-title">
				<Text variant="title.medium">{ parent.title }</Text>
			</div>
			<div className="components-navigation-items">
				{ items.map( ( item ) =>
					! item.isSecondary ? (
						<Item
							key={ item.slug }
							data={ data }
							item={ item }
							setActive={ setActive }
							isActive={ item.slug === active.slug }
						/>
					) : null
				) }
			</div>
			<div className="components-navigation-items is-secondary">
				{ items.map( ( item ) =>
					item.isSecondary ? (
						<Item
							key={ item.slug }
							data={ data }
							item={ item }
							setActive={ setActive }
							isActive={ item.slug === active.slug }
						/>
					) : null
				) }
			</div>
		</div>
	);
};

export default Navigation;
