/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import {
	useRef,
	useLayoutEffect,
	useContext,
	forwardRef,
} from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import SlotFillContext from '../context';
import type { WordPressComponentProps } from '../../context';
import type { SlotComponentProps } from '../types';

function Slot(
	props: WordPressComponentProps<
		Omit< SlotComponentProps, 'bubblesVirtually' >,
		'div'
	>,
	forwardedRef: ForwardedRef< any >
) {
	const {
		name,
		fillProps = {},
		as,
		// `children` is not allowed. However, if it is passed,
		// it will be displayed as is, so remove `children`.
		children,
		...restProps
	} = props;

	const registry = useContext( SlotFillContext );
	const instanceRef = useRef( {} );
	const ref = useRef< HTMLElement >( null );

	const fillPropsRef = useRef( fillProps );
	useLayoutEffect( () => {
		fillPropsRef.current = fillProps;
	}, [ fillProps ] );

	useLayoutEffect( () => {
		const instance = instanceRef.current;
		registry.registerSlot( name, {
			type: 'portal',
			instance,
			ref,
			fillProps: fillPropsRef.current,
		} );
		return () => registry.unregisterSlot( name, instance );
	}, [ registry, name ] );

	useLayoutEffect( () => {
		registry.updateSlot( name, {
			type: 'portal',
			instance: instanceRef.current,
			ref,
			fillProps: fillPropsRef.current,
		} );
	} );

	return (
		<View
			as={ as }
			ref={ useMergeRefs( [ forwardedRef, ref ] ) }
			{ ...restProps }
		/>
	);
}

export default forwardRef( Slot );
