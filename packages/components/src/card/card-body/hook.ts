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
import type { BodyProps } from '../types';

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

	const cx = useCx();

	const classes = useMemo(
		() =>
			cx(
				styles.Body,
				styles.borderRadius,
				styles.cardPaddings[ size ],
				isShady && styles.shady,
				// This classname is added for legacy compatibility reasons.
				'components-card__body',
				className
			),
		[ className, cx, isShady, size ]
	);

	return {
		...otherProps,
		className: classes,
		isScrollable,
	};
}
