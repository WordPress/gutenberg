/**
 * External dependencies
 */
import { SafeAreaView, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { useNavigation } from '@react-navigation/native';
import { useState } from '@wordpress/element';
import { Icon, chevronRight, check } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Cell from '../bottom-sheet/cell';
import NavigationHeader from '../bottom-sheet/navigation-header';
import SubSheet from '../bottom-sheet/sub-sheet';

const BottomSheetSelectControl = ( {
	label,
	options: items,
	onChange,
	value: selectedValue,
} ) => {
	const [ showSubSheet, setShowSubSheet ] = useState( false );
	const navigation = useNavigation();

	const onChangeValue = ( value ) => {
		return () => {
			goBack();
			onChange( value );
		};
	};

	const selectedOption = items.find(
		( option ) => option.value === selectedValue
	);

	const goBack = () => {
		setShowSubSheet( false );
		navigation.goBack();
	};

	const openSubSheet = () => {
		navigation.navigate( SubSheet.screenName );
		setShowSubSheet( true );
	};

	return (
		<SubSheet
			navigationButton={
				<Cell
					label={ label }
					separatorType="none"
					value={ selectedOption.label }
					onPress={ openSubSheet }
					accessibilityRole={ 'button' }
					accessibilityLabel={ selectedOption.label }
					accessibilityHint={ sprintf(
						// translators: %s: Select control button label e.g. "Button width"
						__( 'Navigates to select %s' ),
						selectedOption.label
					) }
				>
					<Icon icon={ chevronRight }></Icon>
				</Cell>
			}
			showSheet={ showSubSheet }
		>
			<SafeAreaView>
				<NavigationHeader
					screen={ label }
					leftButtonOnPress={ goBack }
				/>
				<View paddingHorizontal={ 16 }>
					{ items.map( ( item, index ) => (
						<Cell
							customActionButton
							separatorType="none"
							label={ item.label }
							onPress={ onChangeValue( item.value ) }
							leftAlign={ true }
							key={ index }
							accessibilityRole={ 'button' }
							accessibilityLabel={
								item.value === selectedValue
									? sprintf(
											// translators: %s: Select control option value e.g: "Auto, 25%".
											__( 'Selected: %s' ),
											item.label
									  )
									: item.label
							}
							accessibilityHint={ __( 'Double tap to select' ) }
						>
							{ item.value === selectedValue && (
								<Icon icon={ check }></Icon>
							) }
						</Cell>
					) ) }
				</View>
			</SafeAreaView>
		</SubSheet>
	);
};

export default BottomSheetSelectControl;
