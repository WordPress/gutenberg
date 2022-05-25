/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../../ui/context';
import * as styles from '../styles';
import { useCx } from '../../utils/hooks/use-cx';

/**
 * @param {import('../../ui/context').WordPressComponentProps<import('../types').HeaderProps, 'div'>} props
 */
export function useCardHeader( props ) {
	const {
		className,
		isBorderless = false,
		isShady = false,
		size = 'medium',
		...otherProps
	} = useContextSystem( props, 'CardHeader' );

	const cx = useCx();

	const classes = useMemo(
		() =>
			cx(
				styles.Header,
				styles.borderRadius,
				styles.borderColor,
				styles.cardPaddings[ size ],
				isBorderless && styles.borderless,
				isShady && styles.shady,
				// This classname is added for legacy compatibility reasons.
				'components-card__header',
				className
			),
		[ className, cx, isBorderless, isShady, size ]
	);

	return {
		...otherProps,
		className: classes,
	};
}
