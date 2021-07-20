/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { MutableRefObject } from 'react';

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

export interface UseShiftStepProps {
	isShiftStepEnabled?: boolean;
	shiftStep?: number;
	ref: MutableRefObject< HTMLElement | undefined >;
}

export function useShiftStep( {
	isShiftStepEnabled = true,
	shiftStep = 10,
	ref,
}: UseShiftStepProps ): number {
	const [ on, setOn ] = useState( false );
	useEffect( () => {
		if ( ! ref.current ) {
			return;
		}

		const handleOnKeyDown = ( event: KeyboardEvent ) => {
			if ( ! isShiftStepEnabled ) {
				return;
			}
			if ( event.shiftKey ) {
				setOn( true );
			}
		};
		const handleOnKeyUp = ( event: KeyboardEvent ) => {
			if ( ! isShiftStepEnabled ) {
				return;
			}
			if ( event.shiftKey ) {
				setOn( false );
			}
		};

		ref.current.ownerDocument.addEventListener(
			'keydown',
			handleOnKeyDown
		);
		ref.current.ownerDocument.addEventListener( 'keyup', handleOnKeyUp );

		return () => {
			if ( ! ref.current ) {
				return;
			}
			ref.current.ownerDocument.removeEventListener(
				'keydown',
				handleOnKeyDown
			);
			ref.current.ownerDocument.removeEventListener(
				'keyup',
				handleOnKeyUp
			);
		};
	}, [ isShiftStepEnabled, ref.current ] );

	return isShiftStepEnabled && on ? shiftStep : 1;
}
