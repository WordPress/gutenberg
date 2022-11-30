/**
 * WordPress dependencies
 */
 import { __ } from '@wordpress/i18n';
 import {
     __experimentalHStack as HStack,
     __experimentalVStack as VStack,
     __experimentalUnitControl as UnitControl,
     __experimentalGrid as Grid,
     __experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
     __experimentalUseCustomUnits as useCustomUnits,
     __experimentalDropdownContentWrapper as DropdownContentWrapper,
     BaseControl,
     RangeControl,
     FlexItem,
     ColorIndicator,
     Button,
     PanelBody,
     PanelRow,
     ToggleControl,
     Dropdown,
 } from '@wordpress/components';
import { more, trash } from '@wordpress/icons';
import { useState } from '@wordpress/element';
import { 
    __experimentalColorGradientControl as ColorGradientControl,
    __experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { getSupportedGlobalStylesPanels } from './hooks';


export function useHasShadowPanel( name ) {
    const supports = getSupportedGlobalStylesPanels( name );
    return name && supports.includes( 'shadow' );
}

export function ShadowPanel( { name, shadow, onChange, isPreset, onDelete } ) {
    const panelTitle = name || __( 'Custom shadow' );
    const panelIcon = isPreset ? more : null;

	function handleValueChange(property, value) {
		onChange({...shadow, [property]: value});
	}

	return (
		<PanelBody title={ panelTitle } icon={ panelIcon } initialOpen={ false }>
			<PanelRow>
				<VStack>
					<ShadowInputControl label={__( 'Horizontal Offset' )} value={shadow.offsetX} onChange={(value) => handleValueChange('offsetX', value)} />
					<ShadowInputControl label={__( 'Vertical Offset' )} value={shadow.offsetY} onChange={(value) => handleValueChange('offsetY', value)} />
					<ShadowInputControl label={__( 'Blur' )} value={shadow.blur} min={0} onChange={(value) => handleValueChange('blur', value)} />
					<ShadowInputControl label={__( 'Spread' )} value={shadow.spread} onChange={(value) => handleValueChange('spread', value)} />
                    
                    <Grid columns={2} align="center">
                        <ShadowColorDropdown label={__( 'Color' )} colorValue={shadow.color} onChange={ (value) => handleValueChange('color', value) } />
                        <ToggleControl
                            label={__( 'Inset?' )}
                            checked={ shadow.inset }
                            onChange={ (value) => handleValueChange('inset', value) }
                        />
                    </Grid> 
                    
                    <Button variant='tertiary' icon={trash} onClick={onDelete}>{ __( 'Delete shadow' ) }</Button>
				</VStack>
			</PanelRow>
		</PanelBody>
	);
}

function ShadowInputControl({label, value, min, max, onChange}) {
    const [input, setInput] = useState(value || '0px');
    const [minValue, setMinValue] = useState(min === undefined ? -50 : min);
    const [maxValue, setMaxValue] = useState(max === undefined ? 50 : max);

    const unit = parseQuantityAndUnitFromRawValue(input)[ 1 ] || 'px';
    const units = useCustomUnits( {
        availableUnits: [ 'px', 'em', 'rem' ], // useSetting( 'spacing.units' ) ||
    } );
    const unitConfig = units && units.find( ( item ) => item.value === unit );
    const step = unitConfig?.step || 1;

    const handleInputChange = (newInput) => {
        setInput(newInput);
        onChange(newInput);
    }

    const handleSliderChange = ( next ) => {
        const newInput = next !== undefined ? `${ next }${ unit }` : '0px';
        handleInputChange(newInput);
    }

    const handleUnitChange = (unit) => {
        // setMinValue()
        // setMaxValue()
    }

    return <>
        <BaseControl.VisualLabel as='legend' style={{margin: 0}}>
            { label }
        </BaseControl.VisualLabel>
        <Grid columns={2} align="center">
            <UnitControl
                aria-label={ __( 'X' ) }
                disableUnits={ false }
                isOnly
                value={ input }
                onChange={ handleInputChange }
                onUnitChange = { handleUnitChange }
                size={ '__unstable-large' }
                units={units}
            />
            <RangeControl
                label={ label }
                hideLabelFromVision
                value={ input }
                min={ minValue }
                max={ maxValue }
                initialPosition={ 0 }
                withInputField={ false }
                onChange={ handleSliderChange }
                step={ step }
                __nextHasNoMarginBottom
            />
        </Grid>
    </>
}

const renderToggle =
	( settings ) =>
	( { onToggle, isOpen } ) => {
		const { colorValue, label } = settings;

		const toggleProps = {
			onClick: onToggle,
			className: 'block-editor-panel-color-gradient-settings__dropdown is-open',
			'aria-expanded': isOpen,
		};

		return (
			<Button { ...toggleProps }>
				<LabeledColorIndicator
					colorValue={ colorValue }
					label={ label }
				/>
			</Button>
		);
	};

const ShadowColorDropdown = ({label, colorValue, onChange}) => {

    const {
        colors,
        gradients,
        disableCustomColors,
        disableCustomGradients,
    } = useMultipleOriginColorsAndGradients();

    const setting = {
        colorValue,
        label,
        onColorChange: onChange,
        // onGradientChange: onChange,
    };
    const enableAlpha = false;

    const controlProps = {
        clearable: false,
        colorValue: setting.colorValue,
        colors,
        disableCustomColors,
        disableCustomGradients,
        enableAlpha,
        gradientValue: setting.gradientValue,
        gradients,
        label: setting.label,
        onColorChange: setting.onColorChange,
        onGradientChange: setting.onGradientChange,
        showTitle: false,
        __experimentalHasMultipleOrigins: true,
        __experimentalIsRenderedInSidebar: true,
        ...setting,
    };

    const popoverProps = {
        placement: 'left-start',
        offset: 36,
        shift: true,
    };

    return <Dropdown
        popoverProps={ popoverProps }
        className="block-editor-tools-panel-color-gradient-settings__dropdown"
        renderToggle = { renderToggle({colorValue, label })}
        renderContent={ () => (
            <DropdownContentWrapper paddingSize="none">
                <div className="block-editor-panel-color-gradient-settings__dropdown-content">
                    <ColorGradientControl {...controlProps} />
                </div>
            </DropdownContentWrapper>
        ) }
    />
};

const LabeledColorIndicator = ( { colorValue, label } ) => (
	<HStack justify="flex-start">
		<ColorIndicator
			className="block-editor-panel-color-gradient-settings__color-indicator"
			colorValue={ colorValue }
		/>
		<FlexItem
			className="block-editor-panel-color-gradient-settings__color-name"
			title={ label }
		>
			{ label }
		</FlexItem>
	</HStack>
);
