/**
 * External dependencies
 */
import {
	last,
	take,
	clone,
	uniq,
	map,
	difference,
	each,
	identity,
	some,
} from 'lodash';
import classnames from 'classnames';
import type { KeyboardEvent, MouseEvent, TouchEvent } from 'react';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useDebounce, useInstanceId } from '@wordpress/compose';
import { speak } from '@wordpress/a11y';
import {
	BACKSPACE,
	ENTER,
	UP,
	DOWN,
	LEFT,
	RIGHT,
	SPACE,
	DELETE,
	ESCAPE,
} from '@wordpress/keycodes';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import Token from './token';
import TokenInput from './token-input';
import SuggestionsList from './suggestions-list';
import type { FormTokenFieldProps, TokenItem } from './types';

const initialState = {
	incompleteTokenValue: '',
	inputOffsetFromEnd: 0,
	isActive: false,
	isExpanded: false,
	selectedSuggestionIndex: -1,
	selectedSuggestionScroll: false,
};

export function FormTokenField( props: FormTokenFieldProps ) {
	const {
		autoCapitalize,
		autoComplete,
		maxLength,
		placeholder,
		label = __( 'Add item' ),
		className,
		suggestions = [],
		maxSuggestions = 100,
		value = [],
		displayTransform = identity,
		saveTransform = ( token ) => token.trim(),
		onChange = () => {},
		onInputChange = () => {},
		onFocus = undefined,
		isBorderless = false,
		disabled = false,
		tokenizeOnSpace = false,
		messages = {
			added: __( 'Item added.' ),
			removed: __( 'Item removed.' ),
			remove: __( 'Remove item' ),
			__experimentalInvalid: __( 'Invalid item' ),
		},
		__experimentalExpandOnFocus = false,
		__experimentalValidateInput = () => true,
		__experimentalShowHowTo = true,
	} = props;

	const instanceId = useInstanceId( FormTokenField );

	const [ state, setState ] = useState( initialState );
	const {
		incompleteTokenValue,
		inputOffsetFromEnd,
		isActive,
		isExpanded,
		selectedSuggestionIndex,
		selectedSuggestionScroll,
	} = state;

	const debouncedSpeak = useDebounce( speak, 500 );

	const prevSuggestions = useRef< string[] >();
	const input = useRef< HTMLInputElement >( null );
	const tokensAndInput = useRef< HTMLInputElement >( null );

	useEffect( () => {
		// Make sure to focus the input when the isActive state is true.
		if ( isActive && ! hasFocus() ) {
			focus();
		}

		const suggestionsDidUpdate = ! isShallowEqual(
			suggestions,
			prevSuggestions
		);

		updateSuggestions( suggestionsDidUpdate );

		prevSuggestions.current = suggestions;
	}, [ isActive, suggestions, value ] );

	useEffect( () => {
		updateSuggestions();
	}, [ incompleteTokenValue ] );

	if ( disabled && isActive ) {
		setState( {
			...state,
			isActive: false,
			incompleteTokenValue: '',
		} );
	}

	function focus() {
		input.current?.focus();
	}

	function hasFocus() {
		return input.current === input.current?.ownerDocument.activeElement;
	}

	function onFocusEventHandler( event: FocusEvent ) {
		// If focus is on the input or on the container, set the isActive state to true.
		if ( hasFocus() || event.target === tokensAndInput.current ) {
			setState( {
				...state,
				isActive: true,
				isExpanded: __experimentalExpandOnFocus || isExpanded,
			} );
		} else {
			/*
			 * Otherwise, focus is on one of the token "remove" buttons and we
			 * set the isActive state to false to prevent the input to be
			 * re-focused, see componentDidUpdate().
			 */
			setState( {
				...state,
				isActive: false,
			} );
		}

		if ( 'function' === typeof onFocus ) {
			onFocus( event );
		}
	}

	function onBlur() {
		if ( inputHasValidValue() ) {
			setState( {
				...state,
				isActive: false,
			} );
		} else {
			setState( initialState );
		}
	}

	function onKeyDown( event: KeyboardEvent ) {
		let preventDefault = false;

		if ( event.defaultPrevented ) {
			return;
		}
		// TODO: replace to event.code;
		switch ( event.keyCode ) {
			case BACKSPACE:
				preventDefault = handleDeleteKey( deleteTokenBeforeInput );
				break;
			case ENTER:
				preventDefault = addCurrentToken();
				break;
			case LEFT:
				preventDefault = handleLeftArrowKey();
				break;
			case UP:
				preventDefault = handleUpArrowKey();
				break;
			case RIGHT:
				preventDefault = handleRightArrowKey();
				break;
			case DOWN:
				preventDefault = handleDownArrowKey();
				break;
			case DELETE:
				preventDefault = handleDeleteKey( deleteTokenAfterInput );
				break;
			case SPACE:
				if ( tokenizeOnSpace ) {
					preventDefault = addCurrentToken();
				}
				break;
			case ESCAPE:
				preventDefault = handleEscapeKey( event );
				break;
			default:
				break;
		}

		if ( preventDefault ) {
			event.preventDefault();
		}
	}

	function onKeyPress( event: KeyboardEvent ) {
		let preventDefault = false;
		// TODO: replace to event.code;
		switch ( event.charCode ) {
			case 44: // Comma.
				preventDefault = handleCommaKey();
				break;
			default:
				break;
		}

		if ( preventDefault ) {
			event.preventDefault();
		}
	}

	function onContainerTouched( event: MouseEvent | TouchEvent ) {
		// Prevent clicking/touching the tokensAndInput container from blurring
		// the input and adding the current token.
		if ( event.target === tokensAndInput.current && isActive ) {
			event.preventDefault();
		}
	}

	function onTokenClickRemove( event: { value: string } ) {
		deleteToken( event.value );
		focus();
	}

	function onSuggestionHovered( suggestion: string ) {
		const index = getMatchingSuggestions().indexOf( suggestion );

		if ( index >= 0 ) {
			setState( {
				...state,
				selectedSuggestionIndex: index,
				selectedSuggestionScroll: false,
			} );
		}
	}

	function onSuggestionSelected( suggestion: string ) {
		addNewToken( suggestion );
	}

	function onInputChangeHandler( event: { value: string } ) {
		const text = event.value;
		const separator = tokenizeOnSpace ? /[ ,\t]+/ : /[,\t]+/;
		const items = text.split( separator );
		const tokenValue = last( items ) || '';

		if ( items.length > 1 ) {
			addNewTokens( items.slice( 0, -1 ) );
		}

		setState( { ...state, incompleteTokenValue: tokenValue } );
		onInputChange( tokenValue );
	}

	function handleDeleteKey( _deleteToken: () => void ) {
		let preventDefault = false;
		if ( hasFocus() && isInputEmpty() ) {
			_deleteToken();
			preventDefault = true;
		}

		return preventDefault;
	}

	function handleLeftArrowKey() {
		let preventDefault = false;
		if ( isInputEmpty() ) {
			moveInputBeforePreviousToken();
			preventDefault = true;
		}

		return preventDefault;
	}

	function handleRightArrowKey() {
		let preventDefault = false;
		if ( isInputEmpty() ) {
			moveInputAfterNextToken();
			preventDefault = true;
		}

		return preventDefault;
	}

	function handleUpArrowKey() {
		setState( ( prevState ) => ( {
			...state,
			selectedSuggestionIndex:
				( prevState.selectedSuggestionIndex === 0
					? getMatchingSuggestions(
							prevState.incompleteTokenValue,
							suggestions,
							value,
							maxSuggestions,
							saveTransform
					  ).length
					: prevState.selectedSuggestionIndex ) - 1,
			selectedSuggestionScroll: true,
		} ) );

		return true; // PreventDefault.
	}

	function handleDownArrowKey() {
		setState( ( prevState ) => ( {
			...state,
			selectedSuggestionIndex:
				( prevState.selectedSuggestionIndex + 1 ) %
				getMatchingSuggestions(
					prevState.incompleteTokenValue,
					suggestions,
					value,
					maxSuggestions,
					saveTransform
				).length,
			selectedSuggestionScroll: true,
		} ) );

		return true; // PreventDefault.
	}

	function handleEscapeKey( event: KeyboardEvent ) {
		if ( event.target instanceof HTMLInputElement ) {
			setState( {
				...state,
				incompleteTokenValue: event.target.value,
				isExpanded: false,
				selectedSuggestionIndex: -1,
				selectedSuggestionScroll: false,
			} );
		}

		return true; // PreventDefault.
	}

	function handleCommaKey() {
		if ( inputHasValidValue() ) {
			addNewToken( incompleteTokenValue );
		}

		return true; // PreventDefault.
	}

	function moveInputToIndex( index: number ) {
		setState( () => ( {
			...state,
			inputOffsetFromEnd: value.length - Math.max( index, -1 ) - 1,
		} ) );
	}

	function moveInputBeforePreviousToken() {
		setState( ( prevState ) => ( {
			...state,
			inputOffsetFromEnd: Math.min(
				prevState.inputOffsetFromEnd + 1,
				value.length
			),
		} ) );
	}

	function moveInputAfterNextToken() {
		setState( ( prevState ) => ( {
			...state,
			inputOffsetFromEnd: Math.max( prevState.inputOffsetFromEnd - 1, 0 ),
		} ) );
	}

	function deleteTokenBeforeInput() {
		const index = getIndexOfInput() - 1;

		if ( index > -1 ) {
			deleteToken( value[ index ] );
		}
	}

	function deleteTokenAfterInput() {
		const index = getIndexOfInput();

		if ( index < value.length ) {
			deleteToken( value[ index ] );
			// Update input offset since it's the offset from the last token.
			moveInputToIndex( index );
		}
	}

	function addCurrentToken() {
		let preventDefault = false;
		const selectedSuggestion = getSelectedSuggestion();

		if ( selectedSuggestion ) {
			addNewToken( selectedSuggestion );
			preventDefault = true;
		} else if ( inputHasValidValue() ) {
			addNewToken( incompleteTokenValue );
			preventDefault = true;
		}

		return preventDefault;
	}

	function addNewTokens( tokens: string[] ) {
		const tokensToAdd = uniq(
			tokens
				.map( saveTransform )
				.filter( Boolean )
				.filter( ( token ) => ! valueContainsToken( token ) )
		);

		if ( tokensToAdd.length > 0 ) {
			const newValue = clone( value );
			newValue.splice( getIndexOfInput(), 0, ...tokensToAdd );
			onChange( newValue );
		}
	}

	function addNewToken( token: string ) {
		if ( ! __experimentalValidateInput( token ) ) {
			speak( messages.__experimentalInvalid, 'assertive' );
			return;
		}
		addNewTokens( [ token ] );
		speak( messages.added, 'assertive' );

		setState( {
			...state,
			incompleteTokenValue: '',
			selectedSuggestionIndex: -1,
			selectedSuggestionScroll: false,
			isExpanded: ! __experimentalExpandOnFocus,
		} );

		if ( isActive ) {
			focus();
		}
	}

	function deleteToken( token: string | TokenItem ) {
		const newTokens = value.filter( ( item ) => {
			return getTokenValue( item ) !== getTokenValue( token );
		} );
		onChange( newTokens );
		speak( messages.removed, 'assertive' );
	}

	function getTokenValue( token: { value: string } | string ) {
		if ( 'object' === typeof token ) {
			return token.value;
		}

		return token;
	}

	function getMatchingSuggestions(
		searchValue = incompleteTokenValue,
		_suggestions = suggestions,
		_value = value,
		_maxSuggestions = maxSuggestions,
		_saveTransform = saveTransform
	) {
		let match = _saveTransform( searchValue );
		const startsWithMatch: string[] = [];
		const containsMatch: string[] = [];
		const selected = _value.map( ( item ) => {
			if ( typeof item === 'string' ) {
				return item;
			}
			return item.value;
		} );

		if ( match.length === 0 ) {
			_suggestions = difference( _suggestions, selected );
		} else {
			match = match.toLocaleLowerCase();

			each( _suggestions, ( suggestion ) => {
				const index = suggestion.toLocaleLowerCase().indexOf( match );
				if ( selected.indexOf( suggestion ) === -1 ) {
					if ( index === 0 ) {
						startsWithMatch.push( suggestion );
					} else if ( index > 0 ) {
						containsMatch.push( suggestion );
					}
				}
			} );

			_suggestions = startsWithMatch.concat( containsMatch );
		}

		return take( _suggestions, _maxSuggestions );
	}

	function getSelectedSuggestion() {
		if ( selectedSuggestionIndex !== -1 ) {
			return getMatchingSuggestions()[ selectedSuggestionIndex ];
		}

		return null;
	}

	function valueContainsToken( token: string ) {
		return some( value, ( item ) => {
			return getTokenValue( token ) === getTokenValue( item );
		} );
	}

	function getIndexOfInput() {
		return value.length - inputOffsetFromEnd;
	}

	function isInputEmpty() {
		return incompleteTokenValue.length === 0;
	}

	function inputHasValidValue() {
		return saveTransform( incompleteTokenValue ).length > 0;
	}

	function updateSuggestions( resetSelectedSuggestion = true ) {
		const inputHasMinimumChars = incompleteTokenValue.trim().length > 1;
		const matchingSuggestions = getMatchingSuggestions(
			incompleteTokenValue
		);
		const hasMatchingSuggestions = matchingSuggestions.length > 0;

		const newState = {
			...state,
			isExpanded:
				__experimentalExpandOnFocus ||
				( inputHasMinimumChars && hasMatchingSuggestions ),
		};
		if ( resetSelectedSuggestion ) {
			newState.selectedSuggestionIndex = -1;
			newState.selectedSuggestionScroll = false;
		}

		setState( newState );

		if ( inputHasMinimumChars ) {
			const message = hasMatchingSuggestions
				? sprintf(
						/* translators: %d: number of results. */
						_n(
							'%d result found, use up and down arrow keys to navigate.',
							'%d results found, use up and down arrow keys to navigate.',
							matchingSuggestions.length
						),
						matchingSuggestions.length
				  )
				: __( 'No results.' );

			debouncedSpeak( message, 'assertive' );
		}
	}

	function renderTokensAndInput() {
		const components = map( value, renderToken );
		components.splice( getIndexOfInput(), 0, renderInput() );

		return components;
	}

	function renderToken(
		token: string | TokenItem,
		index: number,
		tokens: ( string | TokenItem )[]
	) {
		const _value = getTokenValue( token );
		const status = typeof token !== 'string' ? token.status : undefined;
		const termPosition = index + 1;
		const termsCount = tokens.length;

		return (
			<Token
				key={ 'token-' + _value }
				value={ _value }
				status={ status }
				title={ typeof token !== 'string' ? token.title : undefined }
				displayTransform={ displayTransform }
				onClickRemove={ onTokenClickRemove }
				isBorderless={
					( typeof token !== 'string' && token.isBorderless ) ||
					isBorderless
				}
				onMouseEnter={
					typeof token !== 'string' ? token.onMouseEnter : undefined
				}
				onMouseLeave={
					typeof token !== 'string' ? token.onMouseLeave : undefined
				}
				disabled={ 'error' !== status && disabled }
				messages={ messages }
				termsCount={ termsCount }
				termPosition={ termPosition }
			/>
		);
	}

	function renderInput() {
		const inputProps = {
			instanceId,
			autoCapitalize,
			autoComplete,
			placeholder: value.length === 0 ? placeholder : '',
			key: 'input',
			disabled,
			value: incompleteTokenValue,
			onBlur,
			isExpanded,
			selectedSuggestionIndex,
		};

		return (
			<TokenInput
				{ ...inputProps }
				onChange={
					! ( maxLength && value.length >= maxLength )
						? onInputChangeHandler
						: undefined
				}
				ref={ input }
			/>
		);
	}

	const classes = classnames(
		className,
		'components-form-token-field__input-container',
		{
			'is-active': isActive,
			'is-disabled': disabled,
		}
	);

	let tokenFieldProps = {
		className: 'components-form-token-field',
		tabIndex: -1,
	};
	const matchingSuggestions = getMatchingSuggestions();

	if ( ! disabled ) {
		tokenFieldProps = Object.assign( {}, tokenFieldProps, {
			onKeyDown,
			onKeyPress,
			onFocus: onFocusEventHandler,
		} );
	}

	// Disable reason: There is no appropriate role which describes the
	// input container intended accessible usability.
	// TODO: Refactor click detection to use blur to stop propagation.
	/* eslint-disable jsx-a11y/no-static-element-interactions */
	return (
		<div { ...tokenFieldProps }>
			<label
				htmlFor={ `components-form-token-input-${ instanceId }` }
				className="components-form-token-field__label"
			>
				{ label }
			</label>
			<div
				ref={ tokensAndInput }
				className={ classes }
				tabIndex={ -1 }
				onMouseDown={ onContainerTouched }
				onTouchStart={ onContainerTouched }
			>
				{ renderTokensAndInput() }
				{ isExpanded && (
					<SuggestionsList
						instanceId={ instanceId }
						match={ saveTransform( incompleteTokenValue ) }
						displayTransform={ displayTransform }
						suggestions={ matchingSuggestions }
						selectedIndex={ selectedSuggestionIndex }
						scrollIntoView={ selectedSuggestionScroll }
						onHover={ onSuggestionHovered }
						onSelect={ onSuggestionSelected }
					/>
				) }
			</div>
			{ __experimentalShowHowTo && (
				<p
					id={ `components-form-token-suggestions-howto-${ instanceId }` }
					className="components-form-token-field__help"
				>
					{ tokenizeOnSpace
						? __(
								'Separate with commas, spaces, or the Enter key.'
						  )
						: __( 'Separate with commas or the Enter key.' ) }
				</p>
			) }
		</div>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions */
}

export default FormTokenField;
