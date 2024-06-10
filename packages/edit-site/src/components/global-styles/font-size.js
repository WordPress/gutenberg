/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalSpacer as Spacer,
	__experimentalUseNavigator as useNavigator,
	__experimentalInputControl as InputControl,
	ToggleControl,
	privateApis as componentsPrivateApis,
	__experimentalHStack as HStack,
	Button,
	FlexItem,
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
	const sizes = fontSizes.theme ?? fontSizes.default;

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
		const newValue = value === 'false' ? false : true;
		updateFontSize( 'fluid', newValue );
	};

	const handleCustomFluidValues = ( value ) => {
		if ( value ) {
			// If custom values are use init the values with the current ones.
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
		<>
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
									{ __( 'Remove font size' ) }
								</DropdownMenuItemLabel>
							</DropdownMenuItem>
						</DropdownMenu>
					</Spacer>
				</FlexItem>
			</HStack>

			<Spacer marginX={ 4 }>
				<FontSizePreview fontSize={ fontSize } />
			</Spacer>

			<Spacer marginX={ 4 }>
				<Spacer marginY={ 4 }>
					<InputControl
						label={ __( 'Name' ) }
						value={ fontSize.name }
						onChange={ handleNameChange }
					/>
				</Spacer>

				<Spacer marginY={ 4 }>
					<SizeControl
						label={ __( 'Size' ) }
						value={ fontSize.size }
						withSlider
						onChange={ handleFontSizeChange }
						hasUnits={ hasUnits }
					/>
				</Spacer>

				<Spacer marginY={ 4 }>
					<ToggleGroupControl
						__nextHasNoMarginBottom
						isBlock
						label={ __( 'Fluid' ) }
						value={ String( isFluid ) }
						onChange={ handleFluidChange }
					>
						<ToggleGroupControlOption
							label={ __( 'Yes' ) }
							value="true"
						/>
						<ToggleGroupControlOption
							label={ __( 'No' ) }
							value="false"
						/>
					</ToggleGroupControl>
				</Spacer>

				{ isFluid && (
					<Spacer marginY={ 4 }>
						<ToggleControl
							label={ __( 'Custom fluid values' ) }
							help={ __(
								'Set custom min and max values for the fluid font size.'
							) }
							checked={ isCustomFluid }
							onChange={ handleCustomFluidValues }
						/>
					</Spacer>
				) }

				{ isCustomFluid && (
					<>
						<Spacer marginY={ 4 }>
							<SizeControl
								label={ __( 'Min' ) }
								value={ fontSize.fluid?.min }
								withSlider
								onChange={ handleMinChange }
								hasUnits={ hasUnits }
							/>
						</Spacer>

						<Spacer marginY={ 4 }>
							<SizeControl
								label={ __( 'Max' ) }
								value={ fontSize.fluid?.max }
								withSlider
								onChange={ handleMaxChange }
								hasUnits={ hasUnits }
							/>
						</Spacer>
					</>
				) }
			</Spacer>
		</>
	);
}

export default FontSize;
