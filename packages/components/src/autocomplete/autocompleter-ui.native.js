/**
 * External dependencies
 */
import { map } from 'lodash';
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
import getDefaultUseItems from './get-default-use-items';

export function getAutoCompleterUI( autocompleter ) {
	const useItems = autocompleter.useItems
		? autocompleter.useItems
		: getDefaultUseItems( autocompleter );

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
