import type { ReactNode } from 'react';
import { useId } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { Text } from '@wordpress/ui';
import { STORE_NAME } from '../../../store';
import NavigationItem from '../navigation-item';
import type { MenuItem } from '../../../store/types';
import styles from './style.module.scss';

interface SectionItemProps {
	/**
	 * Identifier of the parent menu item.
	 */
	id: string;
	/**
	 * Whether to show placeholder icons for alignment.
	 */
	shouldShowPlaceholder?: boolean;
	/**
	 * The section heading.
	 */
	children: ReactNode;
}

/**
 * A group of menu items under a small heading, always shown.
 *
 * @param props                       Component props.
 * @param props.id                    Identifier of the parent menu item.
 * @param props.shouldShowPlaceholder Whether to show placeholder icons.
 * @param props.children              The section heading.
 * @return The section.
 */
export default function SectionItem( {
	id,
	shouldShowPlaceholder,
	children,
}: SectionItemProps ) {
	const headingId = useId();
	const menuItems: MenuItem[] = useSelect(
		( select ) =>
			// @ts-expect-error Store types are not available when selecting by store name.
			select( STORE_NAME ).getMenuItems(),
		[]
	);
	const items = menuItems.filter( ( item ) => item.parent === id );

	return (
		<div
			className={ styles.section }
			role="group"
			aria-labelledby={ headingId }
		>
			<Text
				id={ headingId }
				variant="body-sm"
				className={ styles.heading }
			>
				{ children }
			</Text>
			{ items.map( ( item ) => (
				<NavigationItem
					key={ item.id }
					to={ item.to }
					icon={ item.icon }
					shouldShowPlaceholder={ shouldShowPlaceholder }
				>
					{ item.label }
				</NavigationItem>
			) ) }
		</div>
	);
}
