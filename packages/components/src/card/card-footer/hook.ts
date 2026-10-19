import clsx from 'clsx';
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import styles from '../style.module.scss';
import { getPaddingBySize } from '../get-padding-by-size';
import type { FooterProps } from '../types';

export function useCardFooter(
	props: WordPressComponentProps< FooterProps, 'div' >
) {
	const {
		className,
		justify,
		isBorderless = false,
		isShady = false,
		size = 'medium',
		...otherProps
	} = useContextSystem( props, 'CardFooter' );

	const classes = clsx(
		styles.footer,
		getPaddingBySize( size ),
		{
			[ styles[ 'section-borderless' ] ]: isBorderless,
			[ styles[ 'is-shady' ] ]: isShady,
		},
		// This classname is added for legacy compatibility reasons.
		'components-card__footer',
		className
	);

	return {
		...otherProps,
		className: classes,
		justify,
	};
}
