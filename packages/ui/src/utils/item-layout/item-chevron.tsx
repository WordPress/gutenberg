import clsx from 'clsx';
import { chevronDownSmall, chevronRightSmall } from '@wordpress/icons';
import { Icon } from '../../icon';
import styles from './style.module.css';
import type { ItemChevronDirection } from './types';

export function ItemChevron( {
	className,
	direction,
}: {
	className?: string;
	direction: ItemChevronDirection;
} ) {
	return (
		<Icon
			className={ clsx(
				styles[ 'item-chevron' ],
				styles[ `item-chevron--${ direction }` ],
				className
			) }
			icon={
				direction === 'block-end' ? chevronDownSmall : chevronRightSmall
			}
			size={ 24 }
			aria-hidden="true"
		/>
	);
}
