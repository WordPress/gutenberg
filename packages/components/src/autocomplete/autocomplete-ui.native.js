/**
 * External dependencies
 */
import { escapeRegExp, map, debounce } from 'lodash';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import Popover from 'react-native-popover-view';

/**
 * WordPress dependencies
 */
import { useLayoutEffect, useState } from '@wordpress/element';
import { Icon, PopoverFill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import filterOptions from './filter-options';

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
		selectedIndex,
		onChangeOptions,
		onSelect,
		contentRef,
	} ) {
		const [ popoverVisible, setPopoverVisible ] = useState( true );
		const [ items ] = useItems( filterValue );
		const displayArea = { x: 16, y: 0, width: 160 };

		useLayoutEffect( () => {
			onChangeOptions( items );
			// return () => setPopoverVisible( false );
		}, [ items ] );

		if ( ! items.length > 0 ) {
			return null;
		}

		return (
			<PopoverFill>
				<Popover
					from={ contentRef }
					isVisible={ true }
					mode="tooltip"
					backgroundStyle={ { backgroundColor: 'transparent' } }
					popoverStyle={ { borderWidth: 1, borderColor: '#a7aaad' } }
					arrowStyle={ { backgroundColor: 'transparent' } }
					animationConfig={ {
						duration: 0,
					} }
					// debug
					displayArea={ displayArea }
					placement="bottom"
				>
					<ScrollView
						// horizontal
						style={ {
							width: 160,
							maxHeight: 120,
							paddingVertical: 8,
						} }
						contentContainerStyle={ { flexGrow: 1 } }
						// showsHorizontalScrollIndicator={ false }
						keyboardShouldPersistTaps="always"
					>
						{ map( items, ( option, index ) => {
							return (
								<TouchableOpacity
									activeOpacity={ 0.5 }
									style={ {
										flexDirection: 'row',
										alignItems: 'center',
										marginRight: 10,
										paddingHorizontal: 10,
										paddingVertical: 5,
									} }
									key={ index }
									// hitSlop={ {
									// 	top: 22,
									// 	bottom: 22,
									// 	left: 22,
									// 	right: 22,
									// } }
									onPress={ () => onSelect( option ) }
								>
									<View style={ { marginRight: 4 } }>
										<Icon
											icon={ option?.value?.icon?.src }
											size={ 22 }
										/>
									</View>

									<Text
										style={ [
											index === selectedIndex && {
												color: '#2271b1',
												fontWeight: 'bold',
											},
										] }
									>
										{ option?.value?.title }
									</Text>
								</TouchableOpacity>
							);
						} ) }
					</ScrollView>
				</Popover>
			</PopoverFill>
		);
	}

	return AutocompleterUI;
}

export default getAutoCompleterUI;
