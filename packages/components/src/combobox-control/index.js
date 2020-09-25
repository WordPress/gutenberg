/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { useState, useMemo, useRef, useEffect } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { ENTER, UP, DOWN, ESCAPE } from '@wordpress/keycodes';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import TokenInput from '../form-token-field/token-input';
import SuggestionsList from '../form-token-field/suggestions-list';
import BaseControl from '../base-control';

function ComboboxControl( {
	value,
	label,
	options,
	onChange,
	onInputChange: onInputChangeProp = () => {},
	hideLabelFromVision,
	help,
	messages = {
		selected: __( 'Item selected.' ),
	},
} ) {
	const instanceId = useInstanceId( ComboboxControl );
	const [ selectedSuggestion, setSelectedSuggestion ] = useState( null );
	const [ isExpanded, setIsExpanded ] = useState( false );
	const [ inputValue, setInputValue ] = useState( '' );
	const inputContainer = useRef();

	const matchingSuggestions = useMemo( () => {
		if ( ! inputValue || inputValue.length === 0 ) {
			return options.filter( ( option ) => option.value !== value );
		}
		const startsWithMatch = [];
		const containsMatch = [];
		const match = inputValue.toLocaleLowerCase();
		options.forEach( ( option ) => {
			const index = option.label.toLocaleLowerCase().indexOf( match );
			if ( index === 0 ) {
				startsWithMatch.push( option );
			} else if ( index > 0 ) {
				containsMatch.push( option );
			}
		} );

		return startsWithMatch.concat( containsMatch );
	}, [ inputValue, options, value ] );

	const onSuggestionSelected = ( newSelectedSuggestion ) => {
		onChange( newSelectedSuggestion.value );
		speak( messages.selected, 'assertive' );
		setSelectedSuggestion( newSelectedSuggestion );
		setInputValue( selectedSuggestion.label );
		setIsExpanded( false );
	};

	const handleArrowNavigation = ( offset = 1 ) => {
		const index = matchingSuggestions.indexOf( selectedSuggestion );
		let nextIndex = index + offset;
		if ( nextIndex < 0 ) {
			nextIndex = matchingSuggestions.length - 1;
		} else if ( nextIndex >= matchingSuggestions.length ) {
			nextIndex = 0;
		}
		setSelectedSuggestion( matchingSuggestions[ nextIndex ] );
	};

	const onKeyDown = ( event ) => {
		let preventDefault = false;

		switch ( event.keyCode ) {
			case ENTER:
				if ( selectedSuggestion ) {
					onSuggestionSelected( selectedSuggestion );
					preventDefault = true;
				}
				break;
			case UP:
				handleArrowNavigation( -1 );
				preventDefault = true;
				break;
			case DOWN:
				handleArrowNavigation( 1 );
				preventDefault = true;
				break;
			case ESCAPE:
				setIsExpanded( false );
				setSelectedSuggestion( null );
				preventDefault = true;
				event.stopPropagation();
				break;
			default:
				break;
		}

		if ( preventDefault ) {
			event.preventDefault();
		}
	};

	const updateExpandedState = () => {
		const inputHasMinimumChars =
			!! inputValue && inputValue.trim().length > 1;
		setIsExpanded( inputHasMinimumChars );
	};

	const onFocus = () => {
		// Avoid focus loss when touching the container.
		// TODO: TokenInput should preferably forward ref
		inputContainer.current.input.focus();
		updateExpandedState();
	};

	const onBlur = () => {
		const currentOption = options.find(
			( option ) => option.value === value
		);
		setInputValue( currentOption?.label ?? '' );
		setIsExpanded( false );
	};

	const onInputChange = ( event ) => {
		const text = event.value;
		setInputValue( text );
		onInputChangeProp( text );
	};

	// Expand the suggetions
	useEffect( updateExpandedState, [ inputValue ] );

	// Reset the value on change
	useEffect( () => {
		if ( matchingSuggestions.indexOf( selectedSuggestion ) === -1 ) {
			setSelectedSuggestion( null );
		}
		if ( ! inputValue || matchingSuggestions.length === 0 ) {
			onChange( null );
		}
	}, [ matchingSuggestions, inputValue, value ] );

	// Announcements
	useEffect( () => {
		const hasMatchingSuggestions = matchingSuggestions.length > 0;
		if ( isExpanded ) {
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

			speak( message, 'assertive' );
		}
	}, [ matchingSuggestions, isExpanded ] );

	// Disable reason: There is no appropriate role which describes the
	// input container intended accessible usability.
	// TODO: Refactor click detection to use blur to stop propagation.
	/* eslint-disable jsx-a11y/no-static-element-interactions */
	return (
		<BaseControl
			className="components-combobox-control"
			tabIndex="-1"
			label={ label }
			id={ `components-form-token-input-${ instanceId }` }
			hideLabelFromVision={ hideLabelFromVision }
			help={ help }
		>
			<div
				className="components-combobox-control__suggestions-container"
				tabIndex="-1"
				onFocus={ onFocus }
				onKeyDown={ onKeyDown }
			>
				<TokenInput
					className="components-combobox-control__input"
					instanceId={ instanceId }
					ref={ inputContainer }
					value={ inputValue }
					onBlur={ onBlur }
					isExpanded={ isExpanded }
					selectedSuggestionIndex={ matchingSuggestions.indexOf(
						selectedSuggestion
					) }
					onChange={ onInputChange }
				/>
				{ isExpanded && (
					<SuggestionsList
						instanceId={ instanceId }
						match={ { label: inputValue } }
						displayTransform={ ( suggestion ) => suggestion.label }
						suggestions={ matchingSuggestions }
						selectedIndex={ matchingSuggestions.indexOf(
							selectedSuggestion
						) }
						onHover={ setSelectedSuggestion }
						onSelect={ onSuggestionSelected }
						scrollIntoView
					/>
				) }
			</div>
		</BaseControl>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions */
}

export default ComboboxControl;
