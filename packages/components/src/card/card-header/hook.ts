import clsx from 'clsx';
import type { HookReturnProps, WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import styles from '../style.module.scss';
import { getPaddingBySize } from '../get-padding-by-size';
import type { HeaderProps } from '../types';

export function useCardHeader(
	props: WordPressComponentProps< HeaderProps, 'div' >
): HookReturnProps<
	WordPressComponentProps< HeaderProps, 'div' >,
	'isBorderless' | 'isShady' | 'size',
	{ className: string }
> {
	const {
		className,
		isBorderless = false,
		isShady = false,
		size = 'medium',
		...otherProps
	} = useContextSystem( props, 'CardHeader' );

	const classes = clsx(
		styles.header,
		getPaddingBySize( size ),
		{
			[ styles[ 'section-borderless' ] ]: isBorderless,
			[ styles[ 'is-shady' ] ]: isShady,
		},
		// This classname is added for legacy compatibility reasons.
		'components-card__header',
		className
	);

	return {
		...otherProps,
		className: classes,
	};
}
