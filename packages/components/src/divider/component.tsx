import * as Ariakit from '@ariakit/react';
import clsx from 'clsx';
import type { ForwardedRef } from 'react';
import type { WordPressComponentProps } from '../context';
import { contextConnect, useContextSystem } from '../context';
import { space } from '../utils/space';
import type { DividerProps } from './types';
import styles from './style.module.scss';

export function UnconnectedDivider(
	props: WordPressComponentProps< DividerProps, 'hr', false >,
	forwardedRef: ForwardedRef< any >
) {
	const {
		className,
		margin,
		marginEnd,
		marginStart,
		style,
		...contextProps
	} = useContextSystem( props, 'Divider' );

	const dividerStyle = { ...style };
	const resolvedMarginStart = space( marginStart ?? margin );
	const resolvedMarginEnd = space( marginEnd ?? margin );

	if ( resolvedMarginStart ) {
		dividerStyle[ '--wp-components-divider-margin-start' ] =
			resolvedMarginStart;
	}

	if ( resolvedMarginEnd ) {
		dividerStyle[ '--wp-components-divider-margin-end' ] =
			resolvedMarginEnd;
	}

	return (
		<Ariakit.Separator
			className={ clsx( styles.divider, className ) }
			style={ dividerStyle }
			{ ...contextProps }
			ref={ forwardedRef }
		/>
	);
}

/**
 * `Divider` is a layout component that separates groups of related content.
 */
export const Divider = contextConnect( UnconnectedDivider, 'Divider' );

export default Divider;
