/**
 * External dependencies
 */
import { View, useWindowDimensions } from 'react-native';

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
import { default as getPxFromCssUnit } from '../mobile/utils/get-px-from-css-unit';
import { default as UnitControl, useCustomUnits } from '../unit-control';
import styles from './style.scss';
import BottomSheet from '../mobile/bottom-sheet';

const DEFAULT_FONT_SIZE = 16;

function FontSizePicker( {
	fontSizes = [],
	disableCustomFontSizes = false,
	onChange,
	value: selectedValue,
} ) {
	const [ showSubSheet, setShowSubSheet ] = useState( false );
	const navigation = useNavigation();

	const { height, width } = useWindowDimensions();
	const cssUnitOptions = { height, width, fontSize: DEFAULT_FONT_SIZE };
	// We need to always convert to px units because the selected value
	// could be coming from the web where it could be stored as a different unit.
	const selectedPxValue = getPxFromCssUnit( selectedValue, cssUnitOptions );

	const onChangeValue = ( value ) => {
		return () => {
			goBack();
			onChange( value );
		};
	};

	const selectedOption = fontSizes.find(
		( option ) => option.sizePx === selectedPxValue
	) ?? { name: 'Custom' };

	const goBack = () => {
		setShowSubSheet( false );
		navigation.goBack();
	};

	const openSubSheet = () => {
		navigation.navigate( BottomSheet.SubSheet.screenName );
		setShowSubSheet( true );
	};
	const label = __( 'Font Size' );

	const units = useCustomUnits( {
		availableUnits: [ 'px', 'em', 'rem', 'vw', 'vh' ],
	} );

	const accessibilityLabel = sprintf(
		// translators: %1$s: Font size name e.g. Small
		__( 'Font Size, %1$s' ),
		selectedOption.name
	);

	return (
		<BottomSheet.SubSheet
			navigationButton={
				<BottomSheet.Cell
					label={ label }
					separatorType="none"
					value={
						selectedValue
							? sprintf(
									// translators: %1$s: Select control font size name e.g. Small, %2$s: Select control font size e.g. 12px
									__( '%1$s (%2$s)' ),
									selectedOption.name,
									selectedPxValue
							  )
							: __( 'Default' )
					}
					onPress={ openSubSheet }
					accessibilityRole="button"
					accessibilityLabel={ accessibilityLabel }
					accessibilityHint={ sprintf(
						// translators: %s: Select control button label e.g. Small
						__( 'Navigates to select %s' ),
						selectedOption.name
					) }
				>
					<Icon icon={ chevronRight }></Icon>
				</BottomSheet.Cell>
			}
			showSheet={ showSubSheet }
		>
			<>
				<BottomSheet.NavBar>
					<BottomSheet.NavBar.BackButton onPress={ goBack } />
					<BottomSheet.NavBar.Heading>
						{ label }
					</BottomSheet.NavBar.Heading>
				</BottomSheet.NavBar>
				<View style={ styles[ 'components-font-size-picker' ] }>
					<BottomSheet.Cell
						customActionButton
						separatorType="none"
						label={ __( 'Default' ) }
						onPress={ onChangeValue( undefined ) }
						leftAlign
						key="default"
						accessibilityRole="button"
						accessibilityLabel={ __( 'Selected: Default' ) }
						accessibilityHint={ __(
							'Double tap to select default font size'
						) }
					>
						<View>
							{ selectedValue === undefined && (
								<Icon icon={ check }></Icon>
							) }
						</View>
					</BottomSheet.Cell>
					{ fontSizes.map( ( item, index ) => {
						// Only display a choice that we can currenly select.
						if ( ! parseFloat( item.sizePx ) ) {
							return null;
						}
						return (
							<BottomSheet.Cell
								customActionButton
								separatorType="none"
								label={ item.name }
								subLabel={ item.sizePx }
								onPress={ onChangeValue( item.sizePx ) }
								leftAlign
								key={ index }
								accessibilityRole="button"
								accessibilityLabel={
									item.sizePx === selectedValue
										? sprintf(
												// translators: %s: Select font size option value e.g: "Selected: Large".
												__( 'Selected: %s' ),
												item.name
										  )
										: item.name
								}
								accessibilityHint={ __(
									'Double tap to select font size'
								) }
							>
								<View>
									{ item.sizePx === selectedPxValue && (
										<Icon icon={ check }></Icon>
									) }
								</View>
							</BottomSheet.Cell>
						);
					} ) }
					{ ! disableCustomFontSizes && (
						<UnitControl
							label={ __( 'Custom' ) }
							min={ 0 }
							max={ 200 }
							step={ 1 }
							value={ selectedValue }
							onChange={ ( nextSize ) => {
								if (
									0 === parseFloat( nextSize ) ||
									! nextSize
								) {
									onChange( undefined );
								} else {
									onChange( nextSize );
								}
							} }
							units={ units }
						/>
					) }
				</View>
			</>
		</BottomSheet.SubSheet>
	);
}

export default FontSizePicker;
