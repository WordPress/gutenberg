import clsx from 'clsx';
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import { useItemGroupContext } from '../context';
import type { ItemProps } from '../types';
import styles from '../style.module.scss';

const sizeClassName = {
	small: styles[ 'is-size-small' ],
	medium: styles[ 'is-size-medium' ],
	large: styles[ 'is-size-large' ],
};

export function useItem( props: WordPressComponentProps< ItemProps, 'div' > ) {
	const { isList, spacedAround, size: contextSize } = useItemGroupContext();
	const {
		as: asProp,
		className,
		onClick,
		role = isList ? 'listitem' : undefined,
		size: sizeProp,
		...otherProps
	} = useContextSystem( props, 'Item' );

	const size = sizeProp || contextSize;

	const as = asProp || ( typeof onClick !== 'undefined' ? 'button' : 'div' );

	const classes = clsx(
		styles.item,
		as === 'button' && styles[ 'is-unstyled-button' ],
		as === 'a' && styles[ 'is-unstyled-link' ],
		sizeClassName[ size ] || sizeClassName.medium,
		spacedAround && styles[ 'is-spaced-around' ],
		className
	);

	const wrapperClassName = styles[ 'item-wrapper' ];

	return {
		as,
		className: classes,
		onClick,
		wrapperClassName,
		role,
		...otherProps,
	};
}
