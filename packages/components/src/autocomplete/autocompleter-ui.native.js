/**
 * External dependencies
 */
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';

/**
 * WordPress dependencies
 */
import { useLayoutEffect } from '@wordpress/element';
import { Icon, PopoverFill } from '@wordpress/components';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import getDefaultUseItems from './get-default-use-items';
import styles from './style.scss';

export function getAutoCompleterUI( autocompleter ) {
	const useItems = autocompleter.useItems
		? autocompleter.useItems
		: getDefaultUseItems( autocompleter );

	function AutocompleterUI( {
		filterValue,
		selectedIndex,
		onChangeOptions,
		onSelect,
	} ) {
		const [ items ] = useItems( filterValue );

		useLayoutEffect( () => {
			onChangeOptions( items );
		}, [ items ] );

		const containerStyles = usePreferredColorSchemeStyle(
			styles.container,
			styles.containerDark
		);

		const activeBgStyles = usePreferredColorSchemeStyle(
			styles.activeBg,
			styles.activeBgDark
		);

		const iconStyles = usePreferredColorSchemeStyle(
			styles.icon,
			styles.iconDark
		);

		const textStyles = usePreferredColorSchemeStyle(
			styles.text,
			styles.textActive
		);

		if ( ! items.length > 0 ) {
			return null;
		}

		return (
			<PopoverFill>
				<View style={ containerStyles }>
					<ScrollView
						horizontal
						contentContainerStyle={ styles.content }
						showsHorizontalScrollIndicator={ false }
						keyboardShouldPersistTaps="always"
					>
						{ items.map( ( option, index ) => {
							const isActive = index === selectedIndex;
							return (
								<TouchableOpacity
									activeOpacity={ 0.5 }
									style={ [
										styles.item,
										isActive && activeBgStyles,
									] }
									key={ index }
									onPress={ () => onSelect( option ) }
								>
									<View style={ styles.icon }>
										<Icon
											icon={ option?.value?.icon?.src }
											size={ 24 }
											style={ [
												iconStyles,
												isActive && styles.iconActive,
											] }
										/>
									</View>

									<Text
										style={ [
											textStyles,
											isActive && styles.activeText,
										] }
									>
										{ option?.value?.title }
									</Text>
								</TouchableOpacity>
							);
						} ) }
					</ScrollView>
				</View>
			</PopoverFill>
		);
	}

	return AutocompleterUI;
}

export default getAutoCompleterUI;
