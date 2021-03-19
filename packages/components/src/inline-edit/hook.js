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
 * @property {Function} onWrongInput called when a validate predicate fails
 * @property {Function} onCommit called on enter/blur
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
	const value = isInEditMode ? editingValue : propValue;
	/** @type {import('react').MutableRefObject<HTMLInputElement | undefined>} */
	const inputRef = useRef();
	/** @type {import('react').MutableRefObject<HTMLInputElement | undefined>} */
	const toggleRef = useRef();
	const changeToEditMode = () => setIsInEditMode( true );
	const changeToToggleMode = () => setIsInEditMode( false );



	useEffect( () => {
		if ( isInEditMode ) {
			inputRef.current?.focus();
			inputRef.current?.select();
		} else {
			toggleRef.current?.focus();
		}
	}, [ isInEditMode ] );

	/**
	 * @param {import("react").ChangeEvent<HTMLInputElement>} event
	 */
	const commit = ( event ) => {
		const { value: _value } = event.target;
		cancelEvent( event );
		if ( validate( _value ) ) {
			changeToToggleMode();
			onCommit( _value );
		} else {
			onWrongInput( _value );
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
			setEditingValue( event.target.value );
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

	return {
		isEdit: isInEditMode,
		amendInputProps,
		amendToggleProps,
		value,
	};
}
