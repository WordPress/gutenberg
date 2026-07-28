/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import { useItemGroupContext } from '../context';
import type { ItemProps } from '../types';
import styles from '../style.module.scss';

const sizeClassName = {
	small: styles[ 'size-small' ],
	medium: styles[ 'size-medium' ],
	large: styles[ 'size-large' ],
};

export function useItem( props: WordPressComponentProps< ItemProps, 'div' > ) {
	const {
		as: asProp,
		className,
		onClick,
		role = 'listitem',
		size: sizeProp,
		...otherProps
	} = useContextSystem( props, 'Item' );

	const { spacedAround, size: contextSize } = useItemGroupContext();

	const size = sizeProp || contextSize;

	const as = asProp || ( typeof onClick !== 'undefined' ? 'button' : 'div' );

	const classes = clsx(
		as === 'button' && styles[ 'unstyled-button' ],
		as === 'a' && styles[ 'unstyled-link' ],
		sizeClassName[ size ] || sizeClassName.medium,
		styles.item,
		spacedAround && styles[ 'spaced-around' ],
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
