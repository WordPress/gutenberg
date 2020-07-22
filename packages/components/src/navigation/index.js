/**
 * WordPress dependencies
 */
import { Icon, arrowLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../button';
import Text from '../text';
import Item from './item';

const Navigation = ( { data, active, onSelect } ) => {
	const activeItem = data.find( ( item ) => item.slug === active );
	const parent = data.find( ( item ) => item.slug === activeItem.parent );
	const items = data.filter( ( item ) => item.parent === activeItem.parent );

	const goBack = () => {
		if ( ! parent.parent ) {
			// We are at top level, will need to handle this case.
			return;
		}
		const parentalSiblings = data.filter(
			( item ) => item.parent === parent.parent
		);
		if ( parentalSiblings.length ) {
			onSelect( parentalSiblings[ 0 ].slug );
		}
	};

	return (
		<div className="components-navigation">
			<Button
				isSecondary
				className="components-navigation__back"
				onClick={ goBack }
			>
				<Icon icon={ arrowLeft } />
				{ parent.back }
			</Button>
			<div className="components-navigation__title">
				<Text variant="title.medium">{ parent.title }</Text>
			</div>
			<div className="components-navigation__menu-items">
				{ items.map( ( item ) =>
					item.menu !== 'secondary' ? (
						<Item
							key={ item.slug }
							data={ data }
							item={ item }
							onSelect={ onSelect }
							isActive={ item.slug === active }
						/>
					) : null
				) }
			</div>
			<div className="components-navigation__menu-items is-secondary">
				{ items.map( ( item ) =>
					item.menu === 'secondary' ? (
						<Item
							key={ item.slug }
							data={ data }
							item={ item }
							onSelect={ onSelect }
							isActive={ item.slug === active }
						/>
					) : null
				) }
			</div>
		</div>
	);
};

export default Navigation;
