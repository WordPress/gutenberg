// @ts-nocheck
/**
 * External dependencies
 */
import { isUndefined, negate, noop, flow } from 'lodash';
/**
 * WordPress dependencies
 */
import { useEffect, useState, useRef } from '@wordpress/element';

const cancelEvent = ( event ) => (
	event.preventDefault(), event.stopPropagation(), event
);

const getEventValue = ( { target: { value } } ) => value;
const mergeEvent = ( ...handlers ) => ( event ) =>
	handlers.forEach( ( handler = noop ) => handler( event ) );

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
	const inputRef = useRef();
	const toggleRef = useRef();
	const isInvalid = negate( validate );
	const changeToEditMode = () => setIsInEditMode( true );
	const changeToToggleMode = () => setIsInEditMode( false );

	useEffect( () => {
		setEditingValue( propValue );
		if ( isInvalid( value ) ) onWrongInput( value );
	}, [ propValue ] );

	useEffect( () => {
		if ( isInEditMode ) {
			inputRef.current.focus();
			inputRef.current.select();
			setEditingValue( propValue );
		} else {
			toggleRef.current.focus();
		}
	}, [ isInEditMode ] );

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
		onChange,
		onKeyDown,
		onBlur,
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

	const amendToggleProps = ( { onClick, ...toggleProps } = {} ) => ( {
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
