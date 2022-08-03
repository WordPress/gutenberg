/**
 * External dependencies
 */
import type { ComponentProps } from 'react';

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
import type { CardMedia } from '../index';

export function useCardMedia( props: ComponentProps< typeof CardMedia > ) {
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
