/**
 * External dependencies
 */
import classnames from 'classnames';
import { escapeRegExp, map, debounce, deburr } from 'lodash';

/**
 * WordPress dependencies
 */
import { useLayoutEffect, useState } from '@wordpress/element';
import { useAnchorRef } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import filterOptions from './filter-options';
import Button from '../button';
import Popover from '../popover';

export function getAutoCompleterUI( autocompleter ) {
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
		value,
		contentRef,
	} ) {
		const [ items ] = useItems( filterValue );
		const anchorRef = useAnchorRef( { ref: contentRef, value } );

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
				anchorRef={ anchorRef }
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
							onClick={ () => onSelect( option ) }
						>
							{ option.label }
						</Button>
					) ) }
				</div>
			</Popover>
		);
	}

	return AutocompleterUI;
}
