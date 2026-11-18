import removeAccents from 'remove-accents';
import { debounce } from '@wordpress/compose';
import { useLayoutEffect, useState } from '@wordpress/element';
import { escapeRegExp } from '../utils/strings';
import type { KeyedOption, ListedOptionCompleter } from './types';

function filterOptions(
	search: RegExp,
	options: Array< KeyedOption > = [],
	maxResults = 10
) {
	const filtered = [];
	for ( let i = 0; i < options.length; i++ ) {
		const option = options[ i ];

		// Merge label into keywords.
		let { keywords = [] } = option;
		if ( 'string' === typeof option.label ) {
			keywords = [ ...keywords, option.label ];
		}

		const isMatch = keywords.some( ( keyword ) =>
			search.test( removeAccents( keyword ) )
		);
		if ( ! isMatch ) {
			continue;
		}

		filtered.push( option );

		// Abort early if max reached.
		if ( filtered.length === maxResults ) {
			break;
		}
	}

	return filtered;
}

export default function getDefaultUseItems(
	autocompleter: ListedOptionCompleter
) {
	return ( filterValue: string ) => {
		const [ items, setItems ] = useState< Array< KeyedOption > >( [] );
		// Cleanup invalidates in-flight requests as well as the pending debounce.
		useLayoutEffect( () => {
			let isCanceled = false;
			const { options, isDebounced } = autocompleter;
			const loadOptions = debounce(
				() => {
					return Promise.resolve(
						typeof options === 'function'
							? options( filterValue )
							: options
					).then( ( optionsData ) => {
						if ( isCanceled ) {
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

						// Create a regular expression to filter the options.
						const search = new RegExp(
							'(?:\\b|\\s|^)' + escapeRegExp( filterValue ),
							'i'
						);
						setItems( filterOptions( search, keyedOptions ) );
					} );
				},
				isDebounced ? 250 : 0
			);

			loadOptions();

			return () => {
				isCanceled = true;
				loadOptions.cancel();
			};
		}, [ filterValue ] );

		return [ items ] as const;
	};
}
