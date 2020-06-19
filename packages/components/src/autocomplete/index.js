/**
 * External dependencies
 */
import classnames from 'classnames';
import { escapeRegExp, find, map, debounce, deburr } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	Component,
	renderToString,
	useLayoutEffect,
	useState,
} from '@wordpress/element';
import { ENTER, ESCAPE, UP, DOWN, LEFT, RIGHT } from '@wordpress/keycodes';
import { __, _n, sprintf } from '@wordpress/i18n';
import { withInstanceId, compose } from '@wordpress/compose';
import {
	create,
	slice,
	insert,
	isCollapsed,
	getTextContent,
} from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import Button from '../button';
import Popover from '../popover';
import withSpokenMessages from '../higher-order/with-spoken-messages';

/**
 * A raw completer option.
 *
 * @typedef {*} CompleterOption
 */

/**
 * @callback FnGetOptions
 *
 * @return {(CompleterOption[]|Promise.<CompleterOption[]>)} The completer options or a promise for them.
 */

/**
 * @callback FnGetOptionKeywords
 * @param {CompleterOption} option a completer option.
 *
 * @return {string[]} list of key words to search.
 */

/**
 * @callback FnIsOptionDisabled
 * @param {CompleterOption} option a completer option.
 *
 * @return {string[]} whether or not the given option is disabled.
 */

/**
 * @callback FnGetOptionLabel
 * @param {CompleterOption} option a completer option.
 *
 * @return {(string|Array.<(string|Component)>)} list of react components to render.
 */

/**
 * @callback FnAllowContext
 * @param {string} before the string before the auto complete trigger and query.
 * @param {string} after  the string after the autocomplete trigger and query.
 *
 * @return {boolean} true if the completer can handle.
 */

/**
 * @typedef {Object} OptionCompletion
 * @property {'insert-at-caret'|'replace'} action the intended placement of the completion.
 * @property {OptionCompletionValue} value the completion value.
 */

/**
 * A completion value.
 *
 * @typedef {(string|WPElement|Object)} OptionCompletionValue
 */

/**
 * @callback FnGetOptionCompletion
 * @param {CompleterOption} value the value of the completer option.
 * @param {string} query the text value of the autocomplete query.
 *
 * @return {(OptionCompletion|OptionCompletionValue)} the completion for the given option. If an
 * 													   OptionCompletionValue is returned, the
 * 													   completion action defaults to `insert-at-caret`.
 */

/**
 * @typedef {Object} WPCompleter
 * @property {string} name a way to identify a completer, useful for selective overriding.
 * @property {?string} className A class to apply to the popup menu.
 * @property {string} triggerPrefix the prefix that will display the menu.
 * @property {(CompleterOption[]|FnGetOptions)} options the completer options or a function to get them.
 * @property {?FnGetOptionKeywords} getOptionKeywords get the keywords for a given option.
 * @property {?FnIsOptionDisabled} isOptionDisabled get whether or not the given option is disabled.
 * @property {FnGetOptionLabel} getOptionLabel get the label for a given option.
 * @property {?FnAllowContext} allowContext filter the context under which the autocomplete activates.
 * @property {FnGetOptionCompletion} getOptionCompletion get the completion associated with a given option.
 */

function filterOptions( search, options = [], maxResults = 10 ) {
	const filtered = [];
	for ( let i = 0; i < options.length; i++ ) {
		const option = options[ i ];

		// Merge label into keywords
		let { keywords = [] } = option;
		if ( 'string' === typeof option.label ) {
			keywords = [ ...keywords, option.label ];
		}

		const isMatch = keywords.some( ( keyword ) =>
			search.test( deburr( keyword ) )
		);
		if ( ! isMatch ) {
			continue;
		}

		filtered.push( option );

		// Abort early if max reached
		if ( filtered.length === maxResults ) {
			break;
		}
	}

	return filtered;
}

function getRange() {
	const selection = window.getSelection();
	return selection.rangeCount ? selection.getRangeAt( 0 ) : null;
}

const getAutoCompleterUI = ( autocompleter ) => {
	const useItems = autocompleter.useItems
		? autocompleter.useItems
		: ( filterValue ) => {
				const [ items, setItems ] = useState( [] );
				/*
				 * We support both synchronous and asynchronous retrieval of completer options
				 * but internally treat all as async so we maintain a single, consistent code path.
				 *
				 * Because networks can be slow, and the internet is wonderfully unpredictable,
				 * we don't want two promises updating the state at once. This ensures that only
				 * the most recent promise will act on `optionsData`. This doesn't use the state
				 * because `setState` is batched, and so there's no guarantee that setting
				 * `activePromise` in the state would result in it actually being in `this.state`
				 * before the promise resolves and we check to see if this is the active promise or not.
				 */
				useLayoutEffect( () => {
					const { options, isDebounced } = autocompleter;
					const loadOptions = debounce(
						() => {
							const promise = Promise.resolve(
								typeof options === 'function'
									? options( filterValue )
									: options
							).then( ( optionsData ) => {
								if ( promise.canceled ) {
									return;
								}
								const keyedOptions = optionsData.map(
									( optionData, optionIndex ) => ( {
										key: `${ autocompleter.name }-${ optionIndex }`,
										value: optionData,
										label: autocompleter.getOptionLabel(
											optionData
										),
										keywords: autocompleter.getOptionKeywords
											? autocompleter.getOptionKeywords(
													optionData
											  )
											: [],
										isDisabled: autocompleter.isOptionDisabled
											? autocompleter.isOptionDisabled(
													optionData
											  )
											: false,
									} )
								);

								// create a regular expression to filter the options
								const search = new RegExp(
									'(?:\\b|\\s|^)' +
										escapeRegExp( filterValue ),
									'i'
								);
								setItems(
									filterOptions( search, keyedOptions )
								);
							} );

							return promise;
						},
						isDebounced ? 250 : 0
					);

					const promise = loadOptions();

					return () => {
						loadOptions.cancel();
						if ( promise ) {
							promise.canceled = true;
						}
					};
				}, [ filterValue ] );

				return [ items ];
		  };

	function AutocompleterUI( {
		filterValue,
		instanceId,
		listBoxId,
		className,
		selectedIndex,
		onChangeOptions,
		onSelect,
		onReset,
	} ) {
		const [ items ] = useItems( filterValue );
		useLayoutEffect( () => {
			onChangeOptions( items );
		}, [ items ] );

		if ( ! items.length > 0 ) {
			return null;
		}

		return (
			<Popover
				focusOnMount={ false }
				onClose={ onReset }
				position="top right"
				className="components-autocomplete__popover"
				anchorRef={ getRange() }
			>
				<div
					id={ listBoxId }
					role="listbox"
					className="components-autocomplete__results"
				>
					{ map( items, ( option, index ) => (
						<Button
							key={ option.key }
							id={ `components-autocomplete-item-${ instanceId }-${ option.key }` }
							role="option"
							aria-selected={ index === selectedIndex }
							disabled={ option.isDisabled }
							className={ classnames(
								'components-autocomplete__result',
								className,
								{
									'is-selected': index === selectedIndex,
								}
							) }
							onClick={ () => onSelect }
						>
							{ option.label }
						</Button>
					) ) }
				</div>
			</Popover>
		);
	}

	return AutocompleterUI;
};

export class Autocomplete extends Component {
	static getInitialState() {
		return {
			selectedIndex: 0,
			filteredOptions: [],
			filterValue: '',
			autocompleter: null,
			AutocompleterUI: null,
		};
	}

	constructor() {
		super( ...arguments );

		this.select = this.select.bind( this );
		this.reset = this.reset.bind( this );
		this.onChangeOptions = this.onChangeOptions.bind( this );
		this.handleKeyDown = this.handleKeyDown.bind( this );

		this.state = this.constructor.getInitialState();
	}

	insertCompletion( replacement ) {
		const { autocompleter, filterValue } = this.state;
		const { record, onChange } = this.props;
		const end = record.start;
		const start =
			end - autocompleter.triggerPrefix.length - filterValue.length;
		const toInsert = create( { html: renderToString( replacement ) } );

		onChange( insert( record, toInsert, start, end ) );
	}

	select( option ) {
		const { onReplace } = this.props;
		const { autocompleter, filterValue } = this.state;
		const { getOptionCompletion } = autocompleter || {};

		if ( option.isDisabled ) {
			return;
		}

		if ( getOptionCompletion ) {
			const completion = getOptionCompletion( option.value, filterValue );

			const { action, value } =
				undefined === completion.action ||
				undefined === completion.value
					? { action: 'insert-at-caret', value: completion }
					: completion;

			if ( 'replace' === action ) {
				onReplace( [ value ] );
			} else if ( 'insert-at-caret' === action ) {
				this.insertCompletion( value );
			}
		}

		// Reset autocomplete state after insertion rather than before
		// so insertion events don't cause the completion menu to redisplay.
		this.reset();
	}

	reset() {
		this.setState( this.constructor.getInitialState() );
	}

	announce( filteredOptions ) {
		const { debouncedSpeak } = this.props;
		if ( ! debouncedSpeak ) {
			return;
		}
		if ( !! filteredOptions.length ) {
			debouncedSpeak(
				sprintf(
					/* translators: %d: number of results. */
					_n(
						'%d result found, use up and down arrow keys to navigate.',
						'%d results found, use up and down arrow keys to navigate.',
						filteredOptions.length
					),
					filteredOptions.length
				),
				'assertive'
			);
		} else {
			debouncedSpeak( __( 'No results.' ), 'assertive' );
		}
	}

	/**
	 * Load options for an autocompleter.
	 *
	 * @param {Array} filteredOptions
	 */
	onChangeOptions( filteredOptions ) {
		const selectedIndex =
			filteredOptions.length === this.state.filteredOptions.length
				? this.state.selectedIndex
				: 0;
		this.setState( {
			filteredOptions,
			selectedIndex,
		} );
		this.announce( filteredOptions );
	}

	handleKeyDown( event ) {
		const { autocompleter, selectedIndex, filteredOptions } = this.state;
		if ( ! autocompleter ) {
			return;
		}
		if ( filteredOptions.length === 0 ) {
			return;
		}
		let nextSelectedIndex;
		switch ( event.keyCode ) {
			case UP:
				nextSelectedIndex =
					( selectedIndex === 0
						? filteredOptions.length
						: selectedIndex ) - 1;
				this.setState( { selectedIndex: nextSelectedIndex } );
				break;

			case DOWN:
				nextSelectedIndex =
					( selectedIndex + 1 ) % filteredOptions.length;
				this.setState( { selectedIndex: nextSelectedIndex } );
				break;

			case ESCAPE:
				this.setState( { autocompleter: null } );
				break;

			case ENTER:
				this.select( filteredOptions[ selectedIndex ] );
				break;

			case LEFT:
			case RIGHT:
				this.reset();
				return;

			default:
				return;
		}

		// Any handled keycode should prevent original behavior. This relies on
		// the early return in the default case.
		event.preventDefault();
	}

	componentDidUpdate( prevProps ) {
		const { record, completers } = this.props;
		const { record: prevRecord } = prevProps;

		if ( isCollapsed( record ) ) {
			const text = deburr( getTextContent( slice( record, 0 ) ) );
			const prevText = deburr( getTextContent( slice( prevRecord, 0 ) ) );

			if ( text !== prevText ) {
				const textAfterSelection = getTextContent(
					slice( record, undefined, getTextContent( record ).length )
				);
				const autocompleter = find(
					completers,
					( { triggerPrefix, allowContext } ) => {
						const index = text.lastIndexOf( triggerPrefix );

						if ( index === -1 ) {
							return false;
						}

						if (
							allowContext &&
							! allowContext(
								text.slice( 0, index ),
								textAfterSelection
							)
						) {
							return false;
						}

						return /^\S*$/.test(
							text.slice( index + triggerPrefix.length )
						);
					}
				);

				if ( ! autocompleter ) {
					this.reset();
					return;
				}

				const safeTrigger = escapeRegExp( autocompleter.triggerPrefix );
				const match = text.match(
					new RegExp( `${ safeTrigger }(\\S*)$` )
				);
				const query = match && match[ 1 ];
				this.setState( {
					autocompleter,
					AutocompleterUI:
						autocompleter !== this.state.autocompleter
							? getAutoCompleterUI( autocompleter )
							: this.state.AutocompleterUI,
					filterValue: query,
				} );
			}
		}
	}

	render() {
		const { children, instanceId, isSelected } = this.props;
		const {
			autocompleter,
			selectedIndex,
			filteredOptions,
			AutocompleterUI,
			filterValue,
		} = this.state;
		const { key: selectedKey = '' } =
			filteredOptions[ selectedIndex ] || {};
		const { className } = autocompleter || {};
		const isExpanded = !! autocompleter && filteredOptions.length > 0;
		const listBoxId = isExpanded
			? `components-autocomplete-listbox-${ instanceId }`
			: null;
		const activeId = isExpanded
			? `components-autocomplete-item-${ instanceId }-${ selectedKey }`
			: null;

		return (
			<>
				{ children( {
					isExpanded,
					listBoxId,
					activeId,
					onKeyDown: this.handleKeyDown,
				} ) }
				{ isSelected && AutocompleterUI && (
					<AutocompleterUI
						className={ className }
						filterValue={ filterValue }
						instanceId={ instanceId }
						listBoxId={ listBoxId }
						selectedIndex={ selectedIndex }
						onChangeOptions={ this.onChangeOptions }
						onSelect={ this.onSelect }
						onReset={ this.onReset }
					/>
				) }
			</>
		);
	}
}

export default compose( [ withSpokenMessages, withInstanceId ] )(
	Autocomplete
);
