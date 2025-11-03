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
import type { HeaderProps } from '../types';

export function useCardHeader(
	props: WordPressComponentProps< HeaderProps, 'div' >
) {
	const {
		className,
		isBorderless = false,
		isShady = false,
		...otherProps
	} = useContextSystem( props, 'CardHeader' );

	const cx = useCx();

	const classes = useMemo(
		() =>
			cx(
				styles.Header,
				styles.borderRadius,
				styles.borderColor,
				styles.containerInlinePadding,
				styles.containerBlockPadding,
				isBorderless && styles.borderless,
				isShady && styles.shady,
				// This classname is added for legacy compatibility reasons.
				'components-card__header',
				className
			),
		[ className, cx, isBorderless, isShady ]
	);

	return {
		...otherProps,
		className: classes,
	};
}
