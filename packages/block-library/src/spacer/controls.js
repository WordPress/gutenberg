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
import { MAX_SPACER_SIZE } from './edit';

function DimensionInput( { label, onChange, isResizing, value = '' } ) {
	const [ temporaryInput, setTemporaryInput ] = useState( null );

	const inputId = useInstanceId( UnitControl, 'block-spacer-height-input' );

	// In most contexts the spacer size cannot meaningfully be set to a
	// percentage, since this is relative to the parent container. This
	// unit is disabled from the UI.
	const availableUnitSettings = (
		useSetting( 'spacing.units' ) || undefined
	)?.filter( ( availableUnit ) => availableUnit !== '%' );

	const units = useCustomUnits( {
		availableUnits: availableUnitSettings || [
			'px',
			'em',
			'rem',
			'vw',
			'vh',
		],
		defaultValues: { px: 100, em: 10, rem: 10, vw: 10, vh: 25 },
	} );

	const handleOnChange = ( unprocessedValue ) => {
		setTemporaryInput( null );
		onChange( unprocessedValue );
	};

	const handleOnBlur = () => {
		if ( temporaryInput !== null ) {
			setTemporaryInput( null );
		}
	};

	const inputValue = temporaryInput !== null ? temporaryInput : value;

	return (
		<BaseControl label={ label } id={ inputId }>
			<UnitControl
				id={ inputId }
				isResetValueOnUnitChange
				min={ 0 }
				max={ MAX_SPACER_SIZE }
				onBlur={ handleOnBlur }
				onChange={ handleOnChange }
				style={ { maxWidth: 80 } }
				value={ inputValue }
				units={ units }
				// Force the unit to update to `px` when the Spacer is being resized.
				unit={ isResizing ? 'px' : undefined }
			/>
		</BaseControl>
	);
}

export default function SpacerControls( {
	setAttributes,
	orientation,
	height,
	width,
	isResizing,
} ) {
	return (
		<InspectorControls>
			<PanelBody title={ __( 'Spacer settings' ) }>
				{ orientation === 'horizontal' && (
					<DimensionInput
						label={ __( 'Width' ) }
						value={ width }
						onChange={ ( nextWidth ) =>
							setAttributes( { width: nextWidth } )
						}
						isResizing={ isResizing }
					/>
				) }
				{ orientation !== 'horizontal' && (
					<DimensionInput
						label={ __( 'Height' ) }
						value={ height }
						onChange={ ( nextHeight ) =>
							setAttributes( { height: nextHeight } )
						}
						isResizing={ isResizing }
					/>
				) }
			</PanelBody>
		</InspectorControls>
	);
}
