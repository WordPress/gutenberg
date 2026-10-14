import * as Ariakit from '@ariakit/react';
import clsx from 'clsx';
import { useContext } from '@wordpress/element';
import { Icon, check } from '@wordpress/icons';
import type { CustomSelectItemProps } from './types';
import type { WordPressComponentProps } from '../context';
import styles from './style.module.scss';
import { CustomSelectContext } from './custom-select';

export function CustomSelectItem( {
	children,
	className,
	...props
}: WordPressComponentProps< CustomSelectItemProps, 'div', false > ) {
	const customSelectContext = useContext( CustomSelectContext );
	const size = customSelectContext?.size ?? 'default';
	return (
		<Ariakit.SelectItem
			store={ customSelectContext?.store }
			{ ...props }
			className={ clsx( styles.item, className, {
				[ styles[ 'is-compact' ] ]: size === 'compact',
				[ styles[ 'is-small' ] ]: size === 'small',
			} ) }
		>
			{ children ?? props.value }
			<Ariakit.SelectItemCheck className={ styles[ 'item-check' ] }>
				<Icon icon={ check } />
			</Ariakit.SelectItemCheck>
		</Ariakit.SelectItem>
	);
}

CustomSelectItem.displayName = 'CustomSelectControlV2.Item';

export default CustomSelectItem;
