/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/block-editor';
import { BaseControl, PanelBody, ResizableBox } from '@wordpress/components';
import { compose, withInstanceId, useInstanceId } from '@wordpress/compose';
import { withDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { CSS_UNITS } from './shared';

const MIN_SPACER_HEIGHT = 20;
const MAX_SPACER_HEIGHT = 500;

const SpacerEdit = ( {
	attributes,
	isSelected,
	setAttributes,
	onResizeStart,
	onResizeStop,
} ) => {
	const [ isResizing, setIsResizing ] = useState( false );
	const { height, heightUnit } = attributes;

	const updateHeight = ( value ) => {
		setAttributes( {
			height: value,
		} );
	};

	const updateHeightUnit = ( unit ) => {
		setAttributes( {
			heightUnit: unit,
		} );
	};

	const handleOnResizeStart = ( ...args ) => {
		onResizeStart( ...args );
		setIsResizing( true );
	};

	const handleOnResizeStop = ( event, direction, elt ) => {
		onResizeStop();
		const spacerHeight = elt.clientHeight;
		updateHeight( spacerHeight );
		updateHeightUnit( 'px' );
		setIsResizing( false );
	};

	const resizeHeight = heightUnit ? `${ height }${ heightUnit }` : height;

	return (
		<>
			<ResizableBox
				className={ classnames(
					'block-library-spacer__resize-container',
					{
						'is-selected': isSelected,
					}
				) }
				size={ {
					height: resizeHeight,
				} }
				minHeight={ MIN_SPACER_HEIGHT }
				enable={ {
					top: false,
					right: false,
					bottom: true,
					left: false,
					topRight: false,
					bottomRight: false,
					bottomLeft: false,
					topLeft: false,
				} }
				onResizeStart={ handleOnResizeStart }
				onResizeStop={ handleOnResizeStop }
				showHandle={ isSelected }
				__experimentalShowTooltip={ true }
				__experimentalTooltipProps={ {
					axis: 'y',
					position: 'bottom',
					isVisible: isResizing,
				} }
			/>
			<InspectorControls>
				<PanelBody title={ __( 'Spacer settings' ) }>
					<SpacerHeightInput
						value={ height }
						onChange={ updateHeight }
						unit={ heightUnit }
						onUnitChange={ updateHeightUnit }
					/>
				</PanelBody>
			</InspectorControls>
		</>
	);
};

function SpacerHeightInput( {
	onChange,
	onUnitChange,
	unit = 'px',
	value = '',
} ) {
	const instanceId = useInstanceId( UnitControl );
	const inputId = `block-cover-height-input-${ instanceId }`;

	const handleOnChange = ( unprocessedValue ) => {
		const inputValue =
			unprocessedValue !== ''
				? parseInt( unprocessedValue, 10 )
				: undefined;

		onChange( inputValue );
	};

	const handleOnUnitChange = ( nextUnit ) => {
		onUnitChange( nextUnit );
	};

	const min = unit === 'px' ? MIN_SPACER_HEIGHT : 0;

	return (
		<BaseControl label={ __( 'Height' ) } id={ inputId }>
			<UnitControl
				id={ inputId }
				isResetValueOnUnitChange
				min={ min }
				max={ MAX_SPACER_HEIGHT }
				onChange={ handleOnChange }
				onUnitChange={ handleOnUnitChange }
				step="1"
				style={ { maxWidth: 80 } }
				unit={ unit }
				units={ CSS_UNITS }
				value={ value }
			/>
		</BaseControl>
	);
}

export default compose( [
	withDispatch( ( dispatch ) => {
		const { toggleSelection } = dispatch( 'core/block-editor' );

		return {
			onResizeStart: () => toggleSelection( false ),
			onResizeStop: () => toggleSelection( true ),
		};
	} ),
	withInstanceId,
] )( SpacerEdit );
