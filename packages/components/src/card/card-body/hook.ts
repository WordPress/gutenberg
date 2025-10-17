/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import * as styles from '../styles';
import { useCx } from '../../utils/hooks/use-cx';
import type { BodyProps } from '../types';
import { computePaddingStyle } from '../utils';

export function useCardBody(
	props: WordPressComponentProps< BodyProps, 'div' >
) {
	const {
		className,
		isScrollable = false,
		isShady = false,
		size = 'medium',
		paddingTop,
		paddingRight,
		paddingBottom,
		paddingLeft,
		...otherProps
	} = useContextSystem( props, 'CardBody' );

	const cx = useCx();

	const customPaddingStyle = useMemo( () => {
		const paddingStyle = computePaddingStyle( {
			size,
			paddingTop,
			paddingRight,
			paddingBottom,
			paddingLeft,
		} );

		// If we're using the shorthand padding (no individual overrides),
		// return the legacy style class instead
		if ( paddingStyle.padding !== undefined ) {
			return null;
		}

		return css( paddingStyle );
	}, [ size, paddingTop, paddingRight, paddingBottom, paddingLeft ] );

	const classes = useMemo(
		() =>
			cx(
				styles.Body,
				styles.borderRadius,
				// Only apply the preset padding if no custom padding is used
				customPaddingStyle === null && styles.cardPaddings[ size ],
				customPaddingStyle,
				isShady && styles.shady,
				// This classname is added for legacy compatibility reasons.
				'components-card__body',
				className
			),
		[ className, cx, isShady, size, customPaddingStyle ]
	);

	return {
		...otherProps,
		className: classes,
		isScrollable,
	};
}
