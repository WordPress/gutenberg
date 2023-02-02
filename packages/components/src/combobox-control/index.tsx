/**
 * External dependencies
 */
import classnames from 'classnames';
import type { ComponentProps } from 'react';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	Component,
	useState,
	useMemo,
	useRef,
	useEffect,
} from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { speak } from '@wordpress/a11y';
import { closeSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { InputWrapperFlex } from './styles';
import TokenInput from '../form-token-field/token-input';
import SuggestionsList from '../form-token-field/suggestions-list';
import BaseControl from '../base-control';
import Button from '../button';
import { FlexBlock, FlexItem } from '../flex';
import withFocusOutside from '../higher-order/with-focus-outside';
import { useControlledValue } from '../utils/hooks';
import { normalizeTextString } from '../utils/strings';
import type { ComboboxControlProps, DetectOutsideProps, Option } from './types';

const noop = () => {};

const DetectOutside = withFocusOutside(
	class extends Component< DetectOutsideProps > {
		handleFocusOutside( event: Event ) {
			this.props.onFocusOutside( event );
		}

		render() {
			return this.props.children;
		}
	}
);

function ComboboxControl( {
	/** Start opting into the new margin-free styles that will become the default in a future version. */
	__nextHasNoMarginBottom = false,
	__next36pxDefaultSize,
	value: valueProp,
	label,
	options,
	onChange: onChangeProp,
	onFilterValueChange = noop,
	hideLabelFromVision,
	help,
	allowReset = true,
	className,
	messages = {
		selected: __( 'Item selected.' ),
	},
	__experimentalRenderItem,
}: ComboboxControlProps ) {
	const [ value, setValue ] = useControlledValue( {
		value: valueProp,
		onChange: onChangeProp,
	} );

	const currentOption = options.find( ( option ) => option.value === value );
	const currentLabel = currentOption?.label ?? '';
	// Use a custom prefix when generating the `instanceId` to avoid having
	// duplicate input IDs when rendering this component and `FormTokenField`
	// in the same page (see https://github.com/WordPress/gutenberg/issues/42112).
	const instanceId = useInstanceId( ComboboxControl, 'combobox-control' );
	const [ selectedSuggestion, setSelectedSuggestion ] = useState(
		currentOption || null
	);
	const [ isExpanded, setIsExpanded ] = useState( false );
	const [ inputHasFocus, setInputHasFocus ] = useState( false );
	const [ inputValue, setInputValue ] = useState( '' );
	const inputContainer = useRef< HTMLInputElement >( null );

	const matchingSuggestions = useMemo( () => {
		const startsWithMatch: Option[] = [];
		const containsMatch: Option[] = [];
		const match = normalizeTextString( inputValue );
		options.forEach( ( option ) => {
			const index = normalizeTextString( option.label ).indexOf( match );
			if ( index === 0 ) {
				startsWithMatch.push( option );
			} else if ( index > 0 ) {
				containsMatch.push( option );
			}
		} );

		return startsWithMatch.concat( containsMatch );
	}, [ inputValue, options ] );

	const onSuggestionSelected = ( newSelectedSuggestion: Option ) => {
		setValue( newSelectedSuggestion.value );
		speak( messages.selected, 'assertive' );
		setSelectedSuggestion( newSelectedSuggestion );
		setInputValue( '' );
		setIsExpanded( false );
	};

	const handleArrowNavigation = ( offset = 1 ) => {
		if ( ! selectedSuggestion ) {
			return;
		}

		const index = matchingSuggestions.indexOf( selectedSuggestion );
		let nextIndex = index + offset;
		if ( nextIndex < 0 ) {
			nextIndex = matchingSuggestions.length - 1;
		} else if ( nextIndex >= matchingSuggestions.length ) {
			nextIndex = 0;
		}
		setSelectedSuggestion( matchingSuggestions[ nextIndex ] );
		setIsExpanded( true );
	};

	const onKeyDown: ComponentProps< 'div' >[ 'onKeyDown' ] = ( event ) => {
		let preventDefault = false;

		if (
			event.defaultPrevented ||
			// Ignore keydowns from IMEs
			event.nativeEvent.isComposing ||
			// Workaround for Mac Safari where the final Enter/Backspace of an IME composition
			// is `isComposing=false`, even though it's technically still part of the composition.
			// These can only be detected by keyCode.
			event.keyCode === 229
		) {
			return;
		}

		switch ( event.code ) {
			case 'Enter':
				if ( selectedSuggestion ) {
					onSuggestionSelected( selectedSuggestion );
					preventDefault = true;
				}
				break;
			case 'ArrowUp':
				handleArrowNavigation( -1 );
				preventDefault = true;
				break;
			case 'ArrowDown':
				handleArrowNavigation( 1 );
				preventDefault = true;
				break;
			case 'Escape':
				setIsExpanded( false );
				setSelectedSuggestion( null );
				preventDefault = true;
				break;
			default:
				break;
		}

		if ( preventDefault ) {
			event.preventDefault();
		}
	};

	const onBlur = () => {
		setInputHasFocus( false );
	};

	const onFocus = () => {
		setInputHasFocus( true );
		setIsExpanded( true );
		onFilterValueChange( '' );
		setInputValue( '' );
	};

	const onFocusOutside = () => {
		setIsExpanded( false );
	};

	const onInputChange: ComponentProps< typeof TokenInput >[ 'onChange' ] = (
		event
	) => {
		const text = event.value;
		setInputValue( text );
		onFilterValueChange( text );
		if ( inputHasFocus ) {
			setIsExpanded( true );
		}
	};

	const handleOnReset = () => {
		setValue( undefined );
		inputContainer.current?.focus();
	};

	// Update current selections when the filter input changes.
	useEffect( () => {
		const hasMatchingSuggestions = matchingSuggestions.length > 0;
		const hasSelectedMatchingSuggestions =
			selectedSuggestion &&
			matchingSuggestions.indexOf( selectedSuggestion ) > 0;

		if ( hasMatchingSuggestions && ! hasSelectedMatchingSuggestions ) {
			// If the current selection isn't present in the list of suggestions, then automatically select the first item from the list of suggestions.
			setSelectedSuggestion( matchingSuggestions[ 0 ] );
		}
	}, [ matchingSuggestions, selectedSuggestion ] );

	// Announcements.
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

			speak( message, 'polite' );
		}
	}, [ matchingSuggestions, isExpanded ] );

	// Disable reason: There is no appropriate role which describes the
	// input container intended accessible usability.
	// TODO: Refactor click detection to use blur to stop propagation.
	/* eslint-disable jsx-a11y/no-static-element-interactions */
	return (
		<DetectOutside onFocusOutside={ onFocusOutside }>
			<BaseControl
				__nextHasNoMarginBottom={ __nextHasNoMarginBottom }
				className={ classnames(
					className,
					'components-combobox-control'
				) }
				label={ label }
				id={ `components-form-token-input-${ instanceId }` }
				hideLabelFromVision={ hideLabelFromVision }
				help={ help }
			>
				<div
					className="components-combobox-control__suggestions-container"
					tabIndex={ -1 }
					onKeyDown={ onKeyDown }
				>
					<InputWrapperFlex
						__next36pxDefaultSize={ __next36pxDefaultSize }
					>
						<FlexBlock>
							<TokenInput
								className="components-combobox-control__input"
								instanceId={ instanceId }
								ref={ inputContainer }
								value={ isExpanded ? inputValue : currentLabel }
								onFocus={ onFocus }
								onBlur={ onBlur }
								isExpanded={ isExpanded }
								selectedSuggestionIndex={
									selectedSuggestion
										? matchingSuggestions.indexOf(
												selectedSuggestion
										  )
										: 0
								}
								onChange={ onInputChange }
							/>
						</FlexBlock>
						{ allowReset && (
							<FlexItem>
								<Button
									className="components-combobox-control__reset"
									icon={ closeSmall }
									disabled={ ! value }
									onClick={ handleOnReset }
									label={ __( 'Reset' ) }
								/>
							</FlexItem>
						) }
					</InputWrapperFlex>
					{ isExpanded && (
						<SuggestionsList
							instanceId={ instanceId }
							match={ { label: inputValue, value: inputValue } }
							displayTransform={ ( suggestion ) =>
								suggestion.label
							}
							suggestions={ matchingSuggestions }
							selectedIndex={
								selectedSuggestion
									? matchingSuggestions.indexOf(
											selectedSuggestion
									  )
									: 0
							}
							onHover={ setSelectedSuggestion }
							onSelect={ onSuggestionSelected }
							scrollIntoView
							__experimentalRenderItem={
								__experimentalRenderItem
							}
						/>
					) }
				</div>
			</BaseControl>
		</DetectOutside>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions */
}

export default ComboboxControl;
