/**
 * External dependencies
 */
import { debounce, deburr, escapeRegExp } from 'lodash';

/**
 * WordPress dependencies
 */
import { useLayoutEffect, useState } from '@wordpress/element';

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

export default function getDefaultUseItems( autocompleter ) {
	return ( filterValue ) => {
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
							'(?:\\b|\\s|^)' + escapeRegExp( filterValue ),
							'i'
						);
						setItems( filterOptions( search, keyedOptions ) );
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
}
