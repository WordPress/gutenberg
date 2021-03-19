/**
 * External dependencies
 */
import { isUndefined, negate, noop, flow } from 'lodash';
/**
 * WordPress dependencies
 */
import { useEffect, useState, useRef } from '@wordpress/element';

/**
 * @param {import("react").ChangeEvent<HTMLInputElement>} event
 */
const cancelEvent = ( event ) => (
	event.preventDefault(), event.stopPropagation(), event
);

/**
 * @param {import("react").ChangeEvent<HTMLInputElement>} event
 */
const getEventValue = ( { target: { value } } ) => value;

/**
 * @param {Function[]} handlers
 */
const mergeEvent = ( ...handlers ) =>
	/**
	 * @param {import("react").ChangeEvent<HTMLInputElement>} event
	 */
	( event ) => handlers.forEach( ( handler = noop ) => handler( event ) );

/**
 * @typedef Props
 * @property {(value: string) => boolean} validate predicate
 * @property {( value: string ) => void} onWrongInput called when a validate predicate fails
 * @property {( value: string ) => void} onCommit called on enter/blur
 * @property {string} value input value
 */

/**
 * @param {Props} props
 */
export default function useInlineEdit( {
	validate = negate( isUndefined ),
	onWrongInput = noop,
	onCommit = noop,
	value: propValue,
} ) {
	const [ isInEditMode, setIsInEditMode ] = useState( false );
	const [ editingValue, setEditingValue ] = useState( propValue );
	/** @type {import('react').RefObject<HTMLInputElement>} */
	const inputRef = useRef( null );
	/** @type {import('react').RefObject<HTMLButtonElement>} */
	const toggleRef = useRef( null );
	const isInvalid = negate( validate );
	const changeToEditMode = () => setIsInEditMode( true );
	const changeToToggleMode = () => setIsInEditMode( false );

	useEffect( () => {
		setEditingValue( propValue );
		if ( isInvalid( value ) ) onWrongInput( value );
	}, [ propValue ] );

	useEffect( () => {
		if ( isInEditMode ) {
			inputRef.current?.focus();
			inputRef.current?.select();
			setEditingValue( propValue );
		} else {
			toggleRef.current?.focus();
		}
	}, [ isInEditMode ] );

	/**
	 * @param {import("react").ChangeEvent<HTMLInputElement>} event
	 */
	const commit = ( event ) => {
		const { value } = event.target;
		cancelEvent( event );
		if ( validate( value ) ) {
			changeToToggleMode();
			onCommit( value );
		} else {
			onWrongInput( value );
		}
	};

	/**
	 * @param {import("react").KeyboardEvent<HTMLInputElement> & import("react").ChangeEvent<HTMLInputElement>} event
	 */
	const handleInputActions = ( event ) => {
		if ( 'Enter' === event.key ) {
			commit( event );
		}
		if ( 'Escape' === event.key ) {
			cancelEvent( event );
			event.target.blur();
			changeToToggleMode();
		} else {
			const { value } = event.target;
			setEditingValue( value );
		}
	};

	const amendInputProps = ( {
		onChange = noop,
		onKeyDown = noop,
		onBlur = noop,
		...inputProps
	} = {} ) => ( {
		ref: inputRef,
		onChange: mergeEvent(
			flow( [ getEventValue, setEditingValue ] ),
			onChange
		),
		onKeyDown: mergeEvent( handleInputActions, onKeyDown ),
		onBlur: mergeEvent( commit, onBlur ),
		...inputProps,
	} );

	const amendToggleProps = ( { onClick = noop, ...toggleProps } = {} ) => ( {
		ref: toggleRef,
		onClick: mergeEvent( changeToEditMode, onClick ),
		...toggleProps,
	} );

	const value = isInEditMode ? editingValue : propValue;

	return {
		isEdit: isInEditMode,
		amendInputProps,
		amendToggleProps,
		value,
	};
}
