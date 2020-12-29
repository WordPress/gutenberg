/**
 * External dependencies
 */
import { take, difference, each, identity } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { withInstanceId } from '@wordpress/compose';
import { ENTER, UP, DOWN, LEFT, RIGHT, ESCAPE } from '@wordpress/keycodes';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import TokenInput from './token-input';
import SuggestionsList from './suggestions-list';
import withSpokenMessages from '../higher-order/with-spoken-messages';

const initialState = {
	incompleteTokenValue: '',
	isActive: false,
	isExpanded: false,
	selectedSuggestion: null,
};

class ComboboxControl extends Component {
	constructor() {
		super( ...arguments );
		this.state = initialState;
		this.onKeyDown = this.onKeyDown.bind( this );
		this.onFocus = this.onFocus.bind( this );
		this.onBlur = this.onBlur.bind( this );
		this.onContainerTouched = this.onContainerTouched.bind( this );
		this.onSuggestionHovered = this.onSuggestionHovered.bind( this );
		this.onSuggestionSelected = this.onSuggestionSelected.bind( this );
		this.onInputChange = this.onInputChange.bind( this );
		this.bindInput = this.bindInput.bind( this );
		this.bindTokensAndInput = this.bindTokensAndInput.bind( this );
		this.updateSuggestions = this.updateSuggestions.bind( this );
	}

	componentDidUpdate( prevProps ) {
		// Make sure to focus the input when the isActive state is true.
		if ( this.state.isActive && ! this.input.hasFocus() ) {
			this.input.focus();
		}

		const { suggestions, value } = this.props;
		const suggestionsDidUpdate = ! isShallowEqual(
			suggestions,
			prevProps.suggestions
		);
		if ( suggestionsDidUpdate || value !== prevProps.value ) {
			this.updateSuggestions();
		}
	}

	static getDerivedStateFromProps( props, state ) {
		if ( ! props.disabled || ! state.isActive ) {
			return null;
		}

		return {
			isActive: false,
			incompleteTokenValue: '',
		};
	}

	bindInput( ref ) {
		this.input = ref;
	}

	bindTokensAndInput( ref ) {
		this.tokensAndInput = ref;
	}

	onFocus( event ) {
		// If focus is on the input or on the container, set the isActive state to true.
		if ( this.input.hasFocus() || event.target === this.tokensAndInput ) {
			this.setState( { isActive: true } );
		} else {
			/*
			 * Otherwise, focus is on one of the token "remove" buttons and we
			 * set the isActive state to false to prevent the input to be
			 * re-focused, see componentDidUpdate().
			 */
			this.setState( { isActive: false } );
		}

		if ( 'function' === typeof this.props.onFocus ) {
			this.props.onFocus( event );
		}
	}

	onBlur() {
		this.setState( {
			isActive: false,
			incompleteTokenValue: this.props.value,
			isExpanded: false,
		} );
	}

	onKeyDown( event ) {
		let preventDefault = false;

		switch ( event.keyCode ) {
			case ENTER:
				if ( this.state.selectedSuggestion ) {
					this.onSuggestionSelected( this.state.selectedSuggestion );
					preventDefault = true;
				}
				break;
			case LEFT:
				preventDefault = this.handleLeftArrowKey();
				break;
			case UP:
				preventDefault = this.handleUpArrowKey();
				break;
			case RIGHT:
				preventDefault = this.handleRightArrowKey();
				break;
			case DOWN:
				preventDefault = this.handleDownArrowKey();
				break;
			case ESCAPE:
				preventDefault = this.handleEscapeKey( event );
				event.stopPropagation();
				break;
			default:
				break;
		}

		if ( preventDefault ) {
			event.preventDefault();
		}
	}

	onContainerTouched( event ) {
		// Prevent clicking/touching the tokensAndInput container from blurring
		// the input and adding the current token.
		if ( event.target === this.tokensAndInput && this.state.isActive ) {
			event.preventDefault();
		}
	}

	onSuggestionHovered( suggestion ) {
		this.setState( {
			selectedSuggestion: suggestion,
		} );
	}

	onInputChange( event ) {
		const text = event.value;
		this.setState( { incompleteTokenValue: text }, this.updateSuggestions );
		this.props.onInputChange( text );
	}

	handleUpArrowKey() {
		const matchingSuggestions = this.getMatchingSuggestions();
		const index = matchingSuggestions.indexOf(
			this.state.selectedSuggestion
		);
		if ( index === 0 || index === -1 ) {
			this.setState( {
				selectedSuggestion:
					matchingSuggestions[ matchingSuggestions.length - 1 ],
			} );
		} else {
			this.setState( {
				selectedSuggestion: matchingSuggestions[ index - 1 ],
			} );
		}

		return true; // preventDefault
	}

	handleDownArrowKey() {
		const matchingSuggestions = this.getMatchingSuggestions();
		const index = matchingSuggestions.indexOf(
			this.state.selectedSuggestion
		);
		if ( index === matchingSuggestions.length - 1 || index === -1 ) {
			this.setState( {
				selectedSuggestion: matchingSuggestions[ 0 ],
			} );
		} else {
			this.setState( {
				selectedSuggestion: matchingSuggestions[ index + 1 ],
			} );
		}
		return true; // preventDefault
	}

	handleEscapeKey( event ) {
		this.setState( {
			incompleteTokenValue: event.target.value,
			isExpanded: false,
			selectedSuggestion: null,
		} );
		return true; // preventDefault
	}

	onSuggestionSelected( newValue ) {
		this.props.onChange( newValue );
		this.props.speak( this.props.messages.selected, 'assertive' );

		if ( this.state.isActive ) {
			this.input.focus();
		}

		this.setState( {
			incompleteTokenValue: newValue,
			selectedSuggestion: null,
			isExpanded: false,
		} );
	}

	getMatchingSuggestions(
		searchValue = this.state.incompleteTokenValue,
		suggestions = this.props.suggestions,
		value = this.props.value,
		maxSuggestions = this.props.maxSuggestions,
		saveTransform = this.props.saveTransform
	) {
		let match = saveTransform( searchValue );
		const startsWithMatch = [];
		const containsMatch = [];

		if ( ! match || match.length === 0 ) {
			suggestions = difference( suggestions, value );
		} else {
			match = match.toLocaleLowerCase();

			each( suggestions, ( suggestion ) => {
				const index = suggestion.toLocaleLowerCase().indexOf( match );
				if ( index === 0 ) {
					startsWithMatch.push( suggestion );
				} else if ( index > 0 ) {
					containsMatch.push( suggestion );
				}
			} );

			suggestions = startsWithMatch.concat( containsMatch );
		}

		return take( suggestions, maxSuggestions );
	}

	updateSuggestions() {
		const { incompleteTokenValue, selectedSuggestion } = this.state;
		const inputHasMinimumChars =
			!! incompleteTokenValue && incompleteTokenValue.trim().length > 1;
		const matchingSuggestions = this.getMatchingSuggestions(
			incompleteTokenValue
		);
		const hasMatchingSuggestions = matchingSuggestions.length > 0;

		const newState = {
			isExpanded: inputHasMinimumChars && hasMatchingSuggestions,
		};

		if ( matchingSuggestions.indexOf( selectedSuggestion ) === -1 ) {
			newState.selectedSuggestion = null;
		}

		if (
			! incompleteTokenValue ||
			matchingSuggestions.indexOf( this.props.value ) === -1
		) {
			this.props.onChange( null );
		}

		this.setState( newState );

		if ( inputHasMinimumChars ) {
			const { debouncedSpeak } = this.props;

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

	renderInput() {
		const {
			autoCapitalize,
			autoComplete,
			maxLength,
			value,
			instanceId,
		} = this.props;
		const matchingSuggestions = this.getMatchingSuggestions();

		let props = {
			instanceId,
			autoCapitalize,
			autoComplete,
			ref: this.bindInput,
			key: 'input',
			disabled: this.props.disabled,
			value: this.state.incompleteTokenValue,
			onBlur: this.onBlur,
			isExpanded: this.state.isExpanded,
			selectedSuggestionIndex: matchingSuggestions.indexOf(
				this.state.selectedSuggestion
			),
		};

		if ( ! ( maxLength && value.length >= maxLength ) ) {
			props = { ...props, onChange: this.onInputChange };
		}

		return <TokenInput { ...props } />;
	}

	render() {
		const {
			disabled,
			label = __( 'Select item' ),
			instanceId,
			className,
		} = this.props;
		const {
			isExpanded,
			selectedSuggestion,
			incompleteTokenValue,
		} = this.state;
		const classes = classnames(
			className,
			'components-form-token-field__input-container',
			{
				'is-active': this.state.isActive,
				'is-disabled': disabled,
			}
		);

		let tokenFieldProps = {
			className: 'components-form-token-field',
			tabIndex: '-1',
		};
		const matchingSuggestions = this.getMatchingSuggestions();

		if ( ! disabled ) {
			tokenFieldProps = Object.assign( {}, tokenFieldProps, {
				onKeyDown: this.onKeyDown,
				onFocus: this.onFocus,
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
					ref={ this.bindTokensAndInput }
					className={ classes }
					tabIndex="-1"
					onMouseDown={ this.onContainerTouched }
					onTouchStart={ this.onContainerTouched }
				>
					{ this.renderInput() }
					{ isExpanded && (
						<SuggestionsList
							instanceId={ instanceId }
							match={ this.props.saveTransform(
								incompleteTokenValue
							) }
							displayTransform={ this.props.displayTransform }
							suggestions={ matchingSuggestions }
							selectedIndex={ matchingSuggestions.indexOf(
								selectedSuggestion
							) }
							onHover={ this.onSuggestionHovered }
							onSelect={ this.onSuggestionSelected }
						/>
					) }
				</div>
			</div>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions */
	}
}

ComboboxControl.defaultProps = {
	suggestions: Object.freeze( [] ),
	maxSuggestions: 100,
	value: null,
	displayTransform: identity,
	saveTransform: identity,
	onChange: () => {},
	onInputChange: () => {},
	isBorderless: false,
	disabled: false,
	messages: {
		selected: __( 'Item selected.' ),
	},
};

export default withSpokenMessages( withInstanceId( ComboboxControl ) );
