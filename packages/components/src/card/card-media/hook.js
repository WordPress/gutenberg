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
 * @param {import('../../ui/context').WordPressComponentProps<{ children: import('react').ReactNode }, 'div'>} props
 */
export function useCardMedia( props ) {
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
