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
 * @param {import('../../ui/context').WordPressComponentProps<import('../../divider').DividerProps, 'hr', false>} props
 */
export function useCardDivider( props ) {
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
