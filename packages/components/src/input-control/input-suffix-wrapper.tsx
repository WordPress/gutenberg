import type { ForwardedRef } from 'react';
import clsx from 'clsx';
import { PolymorphicElement } from '../utils/polymorphic-element';
import styles from './style.module.scss';
import type { WordPressComponentProps } from '../context';
import { contextConnect, useContextSystem } from '../context';
import type { PrefixSuffixWrapperProps } from './types';

function UnconnectedInputControlSuffixWrapper(
	props: WordPressComponentProps< PrefixSuffixWrapperProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const derivedProps = useContextSystem( props, 'InputControlSuffixWrapper' );
	const { className, size, variant = 'default' } = derivedProps;

	const classes = clsx( styles[ 'suffix-wrapper' ], className, {
		[ styles[ 'is-small' ] ]: size === 'small',
		[ styles[ 'is-compact' ] ]: size === 'compact',
		[ styles[ 'has-reduced-padding' ] ]: variant !== 'default',
	} );

	return (
		<PolymorphicElement
			as="div"
			{ ...derivedProps }
			className={ classes }
			ref={ forwardedRef }
		/>
	);
}

/**
 * A convenience wrapper for the `suffix` when you want to apply
 * standard padding in accordance with the size variant.
 *
 * ```jsx
 * import {
 *   __experimentalInputControl as InputControl,
 *   __experimentalInputControlSuffixWrapper as InputControlSuffixWrapper,
 * } from '@wordpress/components';
 *
 * <InputControl
 *   suffix={<InputControlSuffixWrapper>%</InputControlSuffixWrapper>}
 * />
 * ```
 */
export const InputControlSuffixWrapper = contextConnect(
	UnconnectedInputControlSuffixWrapper,
	'InputControlSuffixWrapper'
);

export default InputControlSuffixWrapper;
