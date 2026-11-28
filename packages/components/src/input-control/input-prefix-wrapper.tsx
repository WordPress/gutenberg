import type { ForwardedRef } from 'react';
import clsx from 'clsx';
import { PolymorphicElement } from '../utils/polymorphic-element';
import styles from './style.module.scss';
import type { WordPressComponentProps } from '../context';
import { contextConnect, useContextSystem } from '../context';
import type { PrefixSuffixWrapperProps } from './types';

function UnconnectedInputControlPrefixWrapper(
	props: WordPressComponentProps< PrefixSuffixWrapperProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const derivedProps = useContextSystem( props, 'InputControlPrefixWrapper' );
	const { className, size, variant = 'default' } = derivedProps;

	const classes = clsx( styles[ 'prefix-wrapper' ], className, {
		[ styles[ 'is-small' ] ]: size === 'small',
		[ styles[ 'is-compact' ] ]: size === 'compact',
		[ styles[ 'has-reduced-padding' ] ]: variant !== 'default',
	} );

	return (
		<PolymorphicElement
			as="div"
			{ ...derivedProps }
			{ ...{ isPrefix: true } }
			className={ classes }
			ref={ forwardedRef }
		/>
	);
}

/**
 * A convenience wrapper for the `prefix` when you want to apply
 * standard padding in accordance with the size variant.
 *
 * ```jsx
 * import {
 *   __experimentalInputControl as InputControl,
 *   __experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
 * } from '@wordpress/components';
 *
 * <InputControl
 *   prefix={<InputControlPrefixWrapper>@</InputControlPrefixWrapper>}
 * />
 * ```
 */
export const InputControlPrefixWrapper = contextConnect(
	UnconnectedInputControlPrefixWrapper,
	'InputControlPrefixWrapper'
);

export default InputControlPrefixWrapper;
