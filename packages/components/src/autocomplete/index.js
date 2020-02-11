/**
 * External dependencies
 */
import classnames from 'classnames';
import { escapeRegExp, find, map, debounce, deburr } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, renderToString } from '@wordpress/element';
import {
	ENTER,
	ESCAPE,
	UP,
	DOWN,
	LEFT,
	RIGHT,
	SPACE,
} from '@wordpress/keycodes';
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

export class Autocomplete extends Component {
	static getInitialState() {
		return {
			search: /./,
			selectedIndex: 0,
			suppress: undefined,
			open: undefined,
			query: undefined,
			filteredOptions: [],
		};
	}

	constructor() {
		super( ...arguments );

		this.select = this.select.bind( this );
		this.reset = this.reset.bind( this );
		this.resetWhenSuppressed = this.resetWhenSuppressed.bind( this );
		this.handleKeyDown = this.handleKeyDown.bind( this );
		this.debouncedLoadOptions = debounce( this.loadOptions, 250 );

		this.state = this.constructor.getInitialState();
	}

	insertCompletion( replacement ) {
		const { open, query } = this.state;
		const { record, onChange } = this.props;
		const end = record.start;
		const start = end - open.triggerPrefix.length - query.length;
		const toInsert = create( { html: renderToString( replacement ) } );

		onChange( insert( record, toInsert, start, end ) );
	}

	select( option ) {
		const { onReplace } = this.props;
		const { open, query } = this.state;
		const { getOptionCompletion } = open || {};

		if ( option.isDisabled ) {
			return;
		}

		if ( getOptionCompletion ) {
			const completion = getOptionCompletion( option.value, query );

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

	resetWhenSuppressed() {
		const { open, suppress } = this.state;
		if ( open && suppress === open.idx ) {
			this.reset();
		}
	}

	announce( filteredOptions ) {
		const { debouncedSpeak } = this.props;
		if ( ! debouncedSpeak ) {
			return;
		}
		if ( !! filteredOptions.length ) {
			debouncedSpeak(
				sprintf(
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
	 * @param {WPCompleter} completer The autocompleter.
	 * @param {string}      query     The query, if any.
	 */
	loadOptions( completer, query ) {
		const { options } = completer;

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
		const promise = ( this.activePromise = Promise.resolve(
			typeof options === 'function' ? options( query ) : options
		).then( ( optionsData ) => {
			if ( promise !== this.activePromise ) {
				// Another promise has become active since this one was asked to resolve, so do nothing,
				// or else we might end triggering a race condition updating the state.
				return;
			}
			const keyedOptions = optionsData.map(
				( optionData, optionIndex ) => ( {
					key: `${ completer.idx }-${ optionIndex }`,
					value: optionData,
					label: completer.getOptionLabel( optionData ),
					keywords: completer.getOptionKeywords
						? completer.getOptionKeywords( optionData )
						: [],
					isDisabled: completer.isOptionDisabled
						? completer.isOptionDisabled( optionData )
						: false,
				} )
			);

			const filteredOptions = filterOptions(
				this.state.search,
				keyedOptions
			);
			const selectedIndex =
				filteredOptions.length === this.state.filteredOptions.length
					? this.state.selectedIndex
					: 0;
			this.setState( {
				[ 'options_' + completer.idx ]: keyedOptions,
				filteredOptions,
				selectedIndex,
			} );
			this.announce( filteredOptions );
		} ) );
	}

	handleKeyDown( event ) {
		const { open, suppress, selectedIndex, filteredOptions } = this.state;
		if ( ! open ) {
			return;
		}
		if ( suppress === open.idx ) {
			switch ( event.keyCode ) {
				// cancel popup suppression on CTRL+SPACE
				case SPACE:
					const { ctrlKey, shiftKey, altKey, metaKey } = event;
					if ( ctrlKey && ! ( shiftKey || altKey || metaKey ) ) {
						this.setState( { suppress: undefined } );
						event.preventDefault();
						event.stopPropagation();
					}
					break;

				// reset on cursor movement
				case UP:
				case DOWN:
				case LEFT:
				case RIGHT:
					this.reset();
			}
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
				this.setState( { suppress: open.idx } );
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
				const allCompleters = map( completers, ( completer, idx ) => ( {
					...completer,
					idx,
				} ) );
				const open = find(
					allCompleters,
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

				if ( ! open ) {
					this.reset();
					return;
				}

				const safeTrigger = escapeRegExp( open.triggerPrefix );
				const match = text.match(
					new RegExp( `${ safeTrigger }(\\S*)$` )
				);
				const query = match && match[ 1 ];
				const {
					open: wasOpen,
					suppress: wasSuppress,
					query: wasQuery,
				} = this.state;

				if (
					open &&
					( ! wasOpen ||
						open.idx !== wasOpen.idx ||
						query !== wasQuery )
				) {
					if ( open.isDebounced ) {
						this.debouncedLoadOptions( open, query );
					} else {
						this.loadOptions( open, query );
					}
				}
				// create a regular expression to filter the options
				const search = open
					? new RegExp( '(?:\\b|\\s|^)' + escapeRegExp( query ), 'i' )
					: /./;
				// filter the options we already have
				const filteredOptions = open
					? filterOptions(
							search,
							this.state[ 'options_' + open.idx ]
					  )
					: [];
				// check if we should still suppress the popover
				const suppress =
					open && wasSuppress === open.idx ? wasSuppress : undefined;
				// update the state
				if ( wasOpen || open ) {
					this.setState( {
						selectedIndex: 0,
						filteredOptions,
						suppress,
						search,
						open,
						query,
					} );
				}
				// announce the count of filtered options but only if they have loaded
				if ( open && this.state[ 'options_' + open.idx ] ) {
					this.announce( filteredOptions );
				}
			}
		}
	}

	componentWillUnmount() {
		this.debouncedLoadOptions.cancel();
	}

	render() {
		const { children, instanceId, isSelected } = this.props;
		const { open, suppress, selectedIndex, filteredOptions } = this.state;
		const { key: selectedKey = '' } =
			filteredOptions[ selectedIndex ] || {};
		const { className, idx } = open || {};
		const isExpanded = suppress !== idx && filteredOptions.length > 0;
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
				{ isExpanded && isSelected && (
					<Popover
						focusOnMount={ false }
						onClose={ this.reset }
						position="top right"
						className="components-autocomplete__popover"
						anchorRef={ getRange() }
					>
						<div
							id={ listBoxId }
							role="listbox"
							className="components-autocomplete__results"
						>
							{ isExpanded &&
								map( filteredOptions, ( option, index ) => (
									<Button
										key={ option.key }
										id={ `components-autocomplete-item-${ instanceId }-${ option.key }` }
										role="option"
										aria-selected={
											index === selectedIndex
										}
										disabled={ option.isDisabled }
										className={ classnames(
											'components-autocomplete__result',
											className,
											{
												'is-selected':
													index === selectedIndex,
											}
										) }
										onClick={ () => this.select( option ) }
									>
										{ option.label }
									</Button>
								) ) }
						</div>
					</Popover>
				) }
			</>
		);
	}
}

export default compose( [ withSpokenMessages, withInstanceId ] )(
	Autocomplete
);
