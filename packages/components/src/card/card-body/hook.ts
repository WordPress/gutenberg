import clsx from 'clsx';
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import styles from '../style.module.scss';
import type { BodyProps } from '../types';
import { getPaddingBySize } from '../get-padding-by-size';

export function useCardBody(
	props: WordPressComponentProps< BodyProps, 'div' >
) {
	const {
		className,
		isScrollable = false,
		isShady = false,
		size = 'medium',
		...otherProps
	} = useContextSystem( props, 'CardBody' );

	const classes = clsx(
		styles.body,
		getPaddingBySize( size ),
		{
			[ styles[ 'is-scrollable' ] ]: isScrollable,
			[ styles[ 'is-shady' ] ]: isShady,
		},
		// This classname is added for legacy compatibility reasons.
		'components-card__body',
		className
	);

	return {
		...otherProps,
		className: classes,
		isScrollable,
	};
}
