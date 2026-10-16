import clsx from 'clsx';
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import styles from '../style.module.scss';
import type { MediaProps } from '../types';

export function useCardMedia(
	props: WordPressComponentProps< MediaProps, 'div' >
) {
	const { className, ...otherProps } = useContextSystem( props, 'CardMedia' );

	const classes = clsx(
		styles.media,
		// This classname is added for legacy compatibility reasons.
		'components-card__media',
		className
	);

	return {
		...otherProps,
		className: classes,
	};
}
