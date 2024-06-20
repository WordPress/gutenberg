/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import {
	__experimentalSpacer as Spacer,
	__experimentalUseNavigator as useNavigator,
	__experimentalInputControl as InputControl,
	__experimentalView as View,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	privateApis as componentsPrivateApis,
	Button,
	FlexItem,
	ToggleControl,
} from '@wordpress/components';
import { useRef } from '@wordpress/element';
import { moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
const {
	SizeControl,
	DropdownMenuV2: DropdownMenu,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
} = unlock( componentsPrivateApis );
const { useGlobalSetting, useGlobalStyle } = unlock( blockEditorPrivateApis );
import ScreenHeader from './header';

function FontSizePreview( { fontSize } ) {
	const [ font ] = useGlobalStyle( 'typography' );
	return (
		<div
			className="edit-site-typography-preview"
			style={ {
				fontSize: fontSize.size,
				fontFamily: font?.fontFamily ?? 'serif',
			} }
		>
			{ __( 'Aa' ) }
		</div>
	);
}

function FontSize() {
	const {
		params: { slug },
		goBack,
	} = useNavigator();
	const [ fontSizes, setFontSizes ] = useGlobalSetting(
		'typography.fontSizes'
	);
	// Get the font sizes from the theme or use the default ones.
	const sizes = fontSizes.theme ?? fontSizes.default ?? [];

	// Get the font size by slug.
	const fontSize = sizes.find( ( size ) => size.slug === slug );

	const hasUnits = typeof fontSize.size === 'string';

	// Whether fluid is true or an object, set it to true, otherwise false.
	const isFluid = !! fontSize.fluid ?? false;

	// Whether custom fluid values are used.
	const isCustomFluid = typeof fontSize.fluid === 'object';

	// Initialize the ref with the prop value on the first render
	const initialFontSizeRef = useRef( fontSize.size );

	// Memoized initial value of fontSize
	const initialFontSize = initialFontSizeRef.current;

	const handleNameChange = ( value ) => {
		updateFontSize( 'name', value );
	};

	const handleFontSizeChange = ( value ) => {
		// If the user is resetting the value, use the initial value.
		const newValue = value ?? initialFontSize;
		updateFontSize( 'size', newValue );
	};

	const handleFluidChange = ( value ) => {
		updateFontSize( 'fluid', value );
	};

	const handleCustomFluidValues = ( value ) => {
		if ( value ) {
			// If custom values are used, init the values with the current ones.
			updateFontSize( 'fluid', {
				min: fontSize.size,
				max: fontSize.size,
			} );
		} else {
			// If custom fluid values are disabled, set fluid to true.
			updateFontSize( 'fluid', true );
		}
	};

	const handleMinChange = ( value ) => {
		// If the user is resetting the value, use the initial value.
		const newValue = value ?? fontSize.size;
		updateFontSize( 'fluid', { ...fontSize.fluid, min: newValue } );
	};

	const handleMaxChange = ( value ) => {
		// If the user is resetting the value, use the initial value.
		const newValue = value ?? fontSize.size;
		updateFontSize( 'fluid', { ...fontSize.fluid, max: newValue } );
	};

	const updateFontSize = ( key, value ) => {
		const newFontSizes = sizes.map( ( size ) => {
			if ( size.slug === slug ) {
				return { ...size, [ key ]: value }; // Create a new object with updated key
			}
			return size;
		} );

		setFontSizes( {
			...fontSizes,
			theme: newFontSizes,
		} );
	};

	const handleRemoveFontSize = () => {
		// Navigate to the font sizes list.
		goBack();

		const newFontSizes = sizes.filter( ( size ) => size.slug !== slug );
		setFontSizes( {
			...fontSizes,
			theme: newFontSizes,
		} );
	};

	return (
		<VStack spacing={ 4 }>
			<HStack justify="space-between" align="flex-start">
				<ScreenHeader
					title={ fontSize.name }
					description={ sprintf(
						/* translators: %s: font size preset name. */
						__( 'Manage the font size %s.' ),
						fontSize.name
					) }
				/>
				<FlexItem>
					<Spacer marginTop={ 3 } marginBottom={ 0 } paddingX={ 4 }>
						<DropdownMenu
							trigger={
								<Button
									size="small"
									icon={ moreVertical }
									label={ __( 'Menu' ) }
								/>
							}
						>
							<DropdownMenuItem onClick={ handleRemoveFontSize }>
								<DropdownMenuItemLabel>
									{ __( 'Delete' ) }
								</DropdownMenuItemLabel>
							</DropdownMenuItem>
						</DropdownMenu>
					</Spacer>
				</FlexItem>
			</HStack>

			<View>
				<Spacer paddingX={ 4 }>
					<VStack spacing={ 4 }>
						<FlexItem>
							<FontSizePreview fontSize={ fontSize } />
						</FlexItem>

						<InputControl
							label={ __( 'Name' ) }
							value={ fontSize.name }
							onChange={ handleNameChange }
						/>

						<SizeControl
							label={ __( 'Size' ) }
							value={ fontSize.size }
							withSlider
							onChange={ handleFontSizeChange }
							hasUnits={ hasUnits }
							withReset={ false }
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>

						<ToggleControl
							label={ __( 'Fluid typography' ) }
							checked={ isFluid }
							onChange={ handleFluidChange }
						/>

						{ isFluid && (
							<ToggleControl
								label={ __( 'Custom fluid values' ) }
								help={ __(
									'Set custom min and max values for the fluid font size.'
								) }
								checked={ isCustomFluid }
								onChange={ handleCustomFluidValues }
							/>
						) }

						{ isCustomFluid && (
							<>
								<SizeControl
									label={ __( 'Minimum' ) }
									value={ fontSize.fluid?.min }
									withSlider
									onChange={ handleMinChange }
									hasUnits={ hasUnits }
									withReset={ false }
									__nextHasNoMarginBottom
									__next40pxDefaultSize
								/>
								<SizeControl
									label={ __( 'Maximum' ) }
									value={ fontSize.fluid?.max }
									withSlider
									onChange={ handleMaxChange }
									hasUnits={ hasUnits }
									withReset={ false }
									__nextHasNoMarginBottom
									__next40pxDefaultSize
								/>
							</>
						) }
					</VStack>
				</Spacer>
			</View>
		</VStack>
	);
}

export default FontSize;
