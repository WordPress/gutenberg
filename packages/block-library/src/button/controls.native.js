/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	BlockControls,
	useSetting,
} from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	ToolbarGroup,
	ToolbarButton,
	BottomSheetSelectControl,
	UnitControl,
	getValueAndUnit,
	__experimentalUseCustomUnits as useCustomUnits,
} from '@wordpress/components';

import { link } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import ColorEdit from './color-edit';
import styles from './editor.scss';
import { cleanEmptyObject } from '../../../block-editor/src/hooks/utils';

const MIN_BORDER_RADIUS_VALUE = 0;
const MAX_BORDER_RADIUS_VALUE = 50;

function WidthPanel( { selectedWidth, setAttributes } ) {
	function handleChange( newWidth ) {
		// Check if we are toggling the width off
		let width = selectedWidth === newWidth ? undefined : newWidth;
		if ( newWidth === 'auto' ) {
			width = undefined;
		}
		// Update attributes
		setAttributes( { width } );
	}

	const options = [
		{ value: 'auto', label: __( 'Auto' ) },
		{ value: 25, label: '25%' },
		{ value: 50, label: '50%' },
		{ value: 75, label: '75%' },
		{ value: 100, label: '100%' },
	];

	if ( ! selectedWidth ) {
		selectedWidth = 'auto';
	}

	return (
		<PanelBody title={ __( 'Width Settings' ) }>
			<BottomSheetSelectControl
				label={ __( 'Button width' ) }
				value={ selectedWidth }
				onChange={ handleChange }
				options={ options }
			/>
		</PanelBody>
	);
}

const PaddingInputs = ( props ) => {
	const {
		values,
		units,
		sides,
		onChange,
		onChangeUnits,
		unitOptions,
	} = props;

	const LABELS = {
		top: __( 'Top' ),
		bottom: __( 'Bottom' ),
		left: __( 'Left' ),
		right: __( 'Right' ),
	};

	const handleOnChange = ( nextValues ) => {
		onChange( nextValues );
	};

	const handleOnChangeUnits = ( nextUnits ) => {
		onChangeUnits( nextUnits );
	};

	const createHandleOnChange = ( side ) => ( next ) => {
		const nextValues = { ...values };
		nextValues[ side ] = next;
		handleOnChange( nextValues );
	};

	const createHandleOnUnitChange = ( side ) => ( next ) => {
		const nextUnits = { ...units };
		nextUnits[ side ] = next;
		handleOnChangeUnits( nextUnits );
	};

	return (
		<>
			{ sides.map( ( side ) => (
				<UnitControl
					{ ...props }
					value={ values[ side ] }
					unit={ units[ side ] }
					units={ unitOptions }
					min={ units[ side ] === 'px' ? 0 : 1 }
					max={ 100 }
					onChange={ createHandleOnChange( side ) }
					onUnitChange={ createHandleOnUnitChange( side ) }
					style={ styles.rangeCellContainer }
					label={ LABELS[ side ] }
					key={ `box-control-${ side }` }
				/>
			) ) }
		</>
	);
};

const PaddingPanel = ( props ) => {
	const {
		attributes: { style },
		setAttributes,
		defaultPadding,
	} = props;

	const customPaddingSelections = style?.spacing?.padding || {};

	const sides = [ 'top', 'bottom', 'left', 'right' ];
	const values = {};
	const units = {};

	sides.forEach( ( side ) => {
		// Get custom padding selection from the style attribute, falling back to default.
		const paddingForSide = customPaddingSelections[ side ]
			? customPaddingSelections[ side ]
			: defaultPadding[ side ];

		// Break out into value and unit, as UnitControl for native requires setting unit and value separately.
		const { valueToConvert, valueUnit } =
			getValueAndUnit( paddingForSide ) || {};
		values[ side ] = valueToConvert;
		units[ side ] = valueUnit;
	} );

	const unitOptions = useCustomUnits( {
		availableUnits: useSetting( 'spacing.units' ) || [
			'px',
			'em',
			'rem',
			'vw',
			'vh',
		],
		defaultValues: { px: '430', em: '20', rem: '20', vw: '20', vh: '50' },
	} );

	// Update the style object with new padding selections.
	const updatePadding = ( nextValues, nextUnits ) => {
		const updatedPaddingValues = getValuesWithUnits(
			nextValues,
			nextUnits
		);
		const newStyle = {
			...style,
			spacing: {
				...style?.spacing,
				padding: {
					...updatedPaddingValues,
				},
			},
		};
		setAttributes( {
			style: cleanEmptyObject( newStyle ),
		} );
	};

	// Get the values with units, for updating the style.
	const getValuesWithUnits = ( nextValues, nextUnits ) => {
		const valuesWithUnits = {};
		sides.forEach( ( side ) => {
			valuesWithUnits[
				side
			] = `${ nextValues[ side ] }${ nextUnits[ side ] }`;
		} );

		return valuesWithUnits;
	};

	// Update when a value was changed.
	const handleChange = ( nextValues ) => {
		updatePadding( nextValues, units );
	};

	// Update when a unit was changed.
	const handleUnitsChange = ( nextUnits ) => {
		updatePadding( values, nextUnits );
	};

	return (
		<PanelBody title={ __( 'Padding Settings' ) }>
			<PaddingInputs
				values={ values }
				sides={ sides }
				units={ units }
				unitOptions={ unitOptions }
				onChange={ handleChange }
				onChangeUnits={ handleUnitsChange }
			/>
		</PanelBody>
	);
};

export default function Controls( {
	attributes,
	setAttributes,
	clientId,
	borderRadiusValue,
	getLinkSettings,
	onShowLinkSettings,
	onChangeBorderRadius,
	defaultPadding,
} ) {
	const { url, width } = attributes;

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						title={ __( 'Edit link' ) }
						icon={ link }
						onClick={ onShowLinkSettings }
						isActive={ url }
					/>
				</ToolbarGroup>
			</BlockControls>
			{ getLinkSettings( false ) }
			<ColorEdit
				attributes={ attributes }
				setAttributes={ setAttributes }
				clientId={ clientId }
			/>
			<InspectorControls>
				<PanelBody title={ __( 'Border Settings' ) }>
					<RangeControl
						label={ __( 'Border Radius' ) }
						minimumValue={ MIN_BORDER_RADIUS_VALUE }
						maximumValue={ MAX_BORDER_RADIUS_VALUE }
						value={ borderRadiusValue }
						onChange={ onChangeBorderRadius }
					/>
				</PanelBody>
				<WidthPanel
					selectedWidth={ width }
					setAttributes={ setAttributes }
				/>
				<PaddingPanel
					attributes={ attributes }
					setAttributes={ setAttributes }
					defaultPadding={ defaultPadding }
				/>
				<PanelBody title={ __( 'Link Settings' ) }>
					{ getLinkSettings( true ) }
				</PanelBody>
			</InspectorControls>
		</>
	);
}
