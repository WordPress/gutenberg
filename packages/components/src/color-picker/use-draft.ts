/**
 * External dependencies
 */
import type { FocusEventHandler } from 'react';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

type DraftHookProps = {
	value: string;
	onBlur?: FocusEventHandler;
	onChange: ( next: string ) => void;
};

type DraftState = {
	value?: string;
	isStale?: boolean;
};

export const useDraft = ( props: DraftHookProps ) => {
	const refPreviousValue = useRef( props.value );
	const [ draft, setDraft ] = useState< DraftState >( {} );
	const value = draft.value !== undefined ? draft.value : props.value;

	// Determines when to discard the draft value to restore controlled status.
	// To do so, it tracks the previous value and marks the draft value as stale
	// after each render.
	useEffect( () => {
		const { current: previousValue } = refPreviousValue;
		refPreviousValue.current = props.value;
		if ( draft.value !== undefined && ! draft.isStale )
			setDraft( { ...draft, isStale: true } );
		else if ( draft.isStale && props.value !== previousValue )
			setDraft( {} );
	}, [ props.value, draft ] );

	const onChange = ( nextValue: string ) => {
		// Mutates the draft value to avoid an extra render and effect run.
		setDraft( ( current ) =>
			Object.assign( current, { value: nextValue, isStale: false } )
		);
		props.onChange( nextValue );
	};
	const onBlur: FocusEventHandler = ( event ) => {
		setDraft( {} );
		props.onBlur?.( event );
	};

	return { value, onBlur, onChange };
};
