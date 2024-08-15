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
import type { DividerProps } from '../../divider';

export function useCardDivider(
	props: WordPressComponentProps< DividerProps, 'hr', false >
) {
	const { className, ...otherProps } = useContextSystem(
		props,
		'CardDivider'
	);

	const cx = useCx();

	const classes = useMemo(
		() =>
			cx(
				styles.Divider,
				styles.borderColor,
				// This classname is added for legacy compatibility reasons.
				'components-card__divider',
				className
			),
		[ className, cx ]
	);

	return {
		...otherProps,
		className: classes,
	};
}
