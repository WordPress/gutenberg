/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import * as styles from '../styles';
import { useCx } from '../../utils/hooks/use-cx';
import type { MediaProps } from '../types';

export function useCardMedia(
	props: WordPressComponentProps< MediaProps, 'div' >
) {
	const { className, ...otherProps } = useContextSystem( props, 'CardMedia' );

	const cx = useCx();

	const classes = useMemo(
		() =>
			cx(
				styles.Media,
				styles.borderRadius,
				// This classname is added for legacy compatibility reasons.
				'components-card__media',
				className
			),
		[ className, cx ]
	);

	return {
		...otherProps,
		className: classes,
	};
}
