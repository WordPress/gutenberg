import clsx from 'clsx';
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import type { ItemGroupProps } from '../types';
import styles from '../style.module.scss';

export function useItemGroup(
	props: WordPressComponentProps< ItemGroupProps, 'div' >
) {
	const {
		className,
		isBordered = false,
		isRounded = true,
		isSeparated = false,
		role = 'list',
		...otherProps
	} = useContextSystem( props, 'ItemGroup' );

	const classes = clsx(
		styles[ 'item-group' ],
		{
			[ styles[ 'is-bordered' ] ]: isBordered,
			[ styles[ 'is-separated' ] ]: isSeparated,
			[ styles[ 'is-rounded' ] ]: isRounded,
		},
		className
	);

	return {
		isBordered,
		className: classes,
		role,
		isSeparated,
		...otherProps,
	};
}
