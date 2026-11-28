import clsx from 'clsx';
import type { HookReturnProps, WordPressComponentProps } from '../context';
import { useContextSystem } from '../context';
import type { ScrollableProps } from './types';
import styles from './style.module.scss';

export function useScrollable(
	props: WordPressComponentProps< ScrollableProps, 'div' >
): HookReturnProps<
	WordPressComponentProps< ScrollableProps, 'div' >,
	'scrollDirection' | 'smoothScroll',
	{ className: string }
> {
	const {
		className,
		scrollDirection = 'y',
		smoothScroll = false,
		...otherProps
	} = useContextSystem( props, 'Scrollable' );

	const classes = clsx(
		styles.scrollable,
		{
			[ styles[ 'smooth-scroll' ] ]: smoothScroll,
			[ styles[ 'scroll-x' ] ]: scrollDirection === 'x',
			[ styles[ 'scroll-y' ] ]: scrollDirection === 'y',
			[ styles[ 'scroll-auto' ] ]: scrollDirection === 'auto',
		},
		className
	);

	return { ...otherProps, className: classes };
}
