import clsx from 'clsx';
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import styles from '../style.module.scss';
import type { DividerProps } from '../../divider';

/*
 * The explicit return type keeps the emitted declaration from inlining the inferred type,
 * which references `WrapElement` from @ariakit/react-utils
 */
export function useCardDivider(
	props: WordPressComponentProps< DividerProps, 'hr', false >
): WordPressComponentProps< DividerProps, 'hr', false > {
	const { className, ...otherProps } = useContextSystem(
		props,
		'CardDivider'
	);

	const classes = clsx(
		styles.divider,
		// This classname is added for legacy compatibility reasons.
		'components-card__divider',
		className
	);

	return {
		...otherProps,
		className: classes,
	};
}
