/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref, CSSProperties, ReactNode } from 'react';
import { css, SerializedStyles } from '@emotion/react';

/**
 * Internal dependencies
 */
import {
	contextConnect,
	useContextSystem,
	PolymorphicComponentProps,
} from '../ui/context';
import { useCx } from '../utils/hooks';
import {
	getBackgroundColor,
	getTextColorForBackgroundColor,
} from '../utils/backgrounds';

import { Text } from '../text';
import * as styles from './styles';
import { BADGE_COLORS } from './colors';

const { BadgeView } = styles;

export type Props = {
	color?: keyof typeof BADGE_COLORS;
	display?: CSSProperties[ 'display' ];
	isBold?: boolean;
	isRounded?: boolean;
	truncate?: boolean;
	children: ReactNode;
};

function Badge(
	props: PolymorphicComponentProps< Props, 'div' >,
	forwardedRef: Ref< any >
) {
	const {
		children,
		className,
		color: colorProp = 'standard',
		display = 'inline-flex',
		isBold = false,
		isRounded = false,
		truncate = true,
		...otherProps
	} = useContextSystem( props, 'Badge' );

	const badgeColor = BADGE_COLORS[ colorProp ] || BADGE_COLORS.standard;

	const sx: {
		base: SerializedStyles;
	} = {
		base: css( { display } ),
	};

	const cx = useCx();

	const classes = cx(
		sx.base,
		truncate && styles.truncate,
		getBackgroundColor( badgeColor, { isBold } ),
		getTextColorForBackgroundColor( badgeColor, { isBold } ),
		isRounded && styles.rounded,
		className
	);

	return (
		<BadgeView { ...otherProps } className={ classes } ref={ forwardedRef }>
			<Text
				className={ cx( styles.text ) }
				color="currentColor"
				isBlock
				lineHeight={ 1 }
				size={ 10 }
				truncate={ truncate }
				upperCase
				weight={ 700 }
			>
				{ children }
			</Text>
		</BadgeView>
	);
}

export default contextConnect( Badge, 'Badge' );
