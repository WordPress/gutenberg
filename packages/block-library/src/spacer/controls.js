/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, useSetting } from '@wordpress/block-editor';
import {
	BaseControl,
	PanelBody,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	MIN_SPACER_HEIGHT,
	MAX_SPACER_HEIGHT,
	MIN_SPACER_WIDTH,
	MAX_SPACER_WIDTH,
} from './edit';

function DimensionInput( {
	label,
	onChange,
	onUnitChange,
	unit = 'px',
	value = '',
	max,
	min,
} ) {
	const [ temporaryInput, setTemporaryInput ] = useState( null );

	const instanceId = useInstanceId( UnitControl );
	const inputId = `block-spacer-height-input-${ instanceId }`;
	const isPx = unit === 'px';

	const units = useCustomUnits( {
		availableUnits: useSetting( 'spacing.units' ) || [
			'px',
			'em',
			'rem',
			'vw',
			'vh',
		],
		defaultValues: { px: '100', em: '10', rem: '10', vw: '10', vh: '25' },
	} );

	const handleOnChange = ( unprocessedValue ) => {
		let inputValue =
			unprocessedValue !== ''
				? parseFloat( unprocessedValue )
				: undefined;

		if ( isNaN( inputValue ) && inputValue !== undefined ) {
			setTemporaryInput( unprocessedValue );
			return;
		}
		setTemporaryInput( null );

		if ( isPx ) {
			inputValue = Math.min( inputValue, max );
		}
		onChange( inputValue );
		if ( inputValue === undefined ) {
			onUnitChange();
		}
	};

	const handleOnBlur = () => {
		if ( temporaryInput !== null ) {
			setTemporaryInput( null );
		}
	};

	const inputValue = temporaryInput !== null ? temporaryInput : value;
	const minValue = isPx ? min : 0;
	const maxValue = isPx ? max : undefined;

	return (
		<BaseControl label={ label } id={ inputId }>
			<UnitControl
				id={ inputId }
				isResetValueOnUnitChange
				min={ minValue }
				max={ maxValue }
				onBlur={ handleOnBlur }
				onChange={ handleOnChange }
				onUnitChange={ onUnitChange }
				style={ { maxWidth: 80 } }
				unit={ unit }
				units={ units }
				value={ inputValue }
			/>
		</BaseControl>
	);
}

export default function SpacerControls( {
	setAttributes,
	orientation,
	height,
	width,
	heightUnit,
	widthUnit,
} ) {
	return (
		<InspectorControls>
			<PanelBody title={ __( 'Spacer settings' ) }>
				{ orientation === 'horizontal' && (
					<DimensionInput
						label={ __( 'Width' ) }
						value={ width }
						max={ MAX_SPACER_WIDTH }
						min={ MIN_SPACER_WIDTH }
						unit={ widthUnit }
						onChange={ ( nextWidth ) =>
							setAttributes( { width: nextWidth } )
						}
						onUnitChange={ ( nextUnit ) =>
							setAttributes( {
								widthUnit: nextUnit,
							} )
						}
					/>
				) }
				{ orientation !== 'horizontal' && (
					<DimensionInput
						label={ __( 'Height' ) }
						value={ height }
						max={ MAX_SPACER_HEIGHT }
						min={ MIN_SPACER_HEIGHT }
						unit={ heightUnit }
						onChange={ ( nextHeight ) =>
							setAttributes( { height: nextHeight } )
						}
						onUnitChange={ ( nextUnit ) =>
							setAttributes( {
								heightUnit: nextUnit,
							} )
						}
					/>
				) }
			</PanelBody>
		</InspectorControls>
	);
}
