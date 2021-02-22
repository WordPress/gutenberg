/**
 * External dependencies
 */
import { isUndefined, negate, noop } from 'lodash';
/**
 * WordPress dependencies
 */
import { useEffect, useState, useRef } from '@wordpress/element';

const cancelEvent = ( event ) => (
	event.preventDefault(), event.stopPropagation()
);

const mergeEvent = ( ...handlers ) => ( event ) =>
	handlers.forEach( ( handler = noop ) => handler( event ) );

export function useInlineEdit( {
	validate = negate( isUndefined ),
	onWrongInput = noop,
	onChange: onInputChange = noop,
	value: propValue,
} ) {
	const [ isInEditMode, setIsInEditMode ] = useState( false );
	const [ editingValue, setEditingValue ] = useState( propValue );
	const inputRef = useRef();
	const toggleRef = useRef();

	useEffect( () => {
		setEditingValue( propValue );
		if ( ! validate( value ) ) onWrongInput( value );
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

	const handleOnCommit = ( event ) => {
		const { value } = event.target;
		cancelEvent( event );
		if ( validate( value ) ) {
			setIsInEditMode( false );
			onInputChange( value );
		} else {
			onWrongInput( value );
		}
	};

	const handleOnChange = ( event ) => {
		setEditingValue( event.target.value );
	};

	const handleOnKeyDown = ( event ) => {
		if ( 'Enter' === event.key ) {
			handleOnCommit( event );
		}
		if ( 'Escape' === event.key ) {
			cancelEvent( event );
			event.target.blur();
		}
	};

	const handleOnClick = () => setIsInEditMode( true );

	const amendInputProps = ( {
		onChange,
		onKeyDown,
		onBlur,
		...inputProps
	} = {} ) => ( {
		ref: inputRef,
		onChange: mergeEvent( handleOnChange, onChange ),
		onKeyDown: mergeEvent( handleOnKeyDown, onKeyDown ),
		onBlur: mergeEvent( handleOnCommit, onBlur ),
		...inputProps,
	} );

	const amendToggleProps = ( { onClick, ...toggleProps } = {} ) => ( {
		ref: toggleRef,
		onClick: mergeEvent( handleOnClick, onClick ),
		...toggleProps,
	} );

	const value = isInEditMode ? editingValue : value;

	return {
		isEdit: isInEditMode,
		amendInputProps,
		amendToggleProps,
		value,
	};
}
