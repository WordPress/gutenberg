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
import SlotFillContext from './slot-fill-context';
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

	const ref = useRef< HTMLElement >( null );

	// We don't want to unregister and register the slot whenever
	// `fillProps` change, which would cause the fill to be re-mounted. Instead,
	// we can just update the slot (see hook below).
	// For more context, see https://github.com/WordPress/gutenberg/pull/44403#discussion_r994415973
	const fillPropsRef = useRef( fillProps );
	useLayoutEffect( () => {
		fillPropsRef.current = fillProps;
	}, [ fillProps ] );

	useLayoutEffect( () => {
		registry.registerSlot( name, ref, fillPropsRef.current );
		return () => registry.unregisterSlot( name, ref );
	}, [ registry, name ] );

	useLayoutEffect( () => {
		registry.updateSlot( name, ref, fillPropsRef.current );
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
