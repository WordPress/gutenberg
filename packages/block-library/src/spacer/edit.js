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
	useBlockProps,
	useSetting,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	BaseControl,
	PanelBody,
	ResizableBox,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { compose, withInstanceId, useInstanceId } from '@wordpress/compose';
import { withDispatch } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { View } from '@wordpress/primitives';

const MIN_SPACER_HEIGHT = 1;
const MAX_SPACER_HEIGHT = 500;

const MIN_SPACER_WIDTH = 1;
const MAX_SPACER_WIDTH = 500;

function DimensionInput( {
	label,
	onChange,
	onUnitChange,
	unit = 'px',
	value = '',
} ) {
	const [ temporaryInput, setTemporaryInput ] = useState( null );

	const instanceId = useInstanceId( UnitControl );
	const inputId = `block-cover-height-input-${ instanceId }`;
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
		const inputValue =
			unprocessedValue !== ''
				? parseFloat( unprocessedValue )
				: undefined;

		if ( isNaN( inputValue ) && inputValue !== undefined ) {
			setTemporaryInput( unprocessedValue );
			return;
		}
		setTemporaryInput( null );
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
	const min = isPx ? MIN_SPACER_HEIGHT : 0;

	return (
		<BaseControl label={ label } id={ inputId }>
			<UnitControl
				id={ inputId }
				isResetValueOnUnitChange
				min={ min }
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

const SpacerEdit = ( {
	attributes,
	isSelected,
	setAttributes,
	onResizeStart,
	onResizeStop,
	context,
} ) => {
	const { orientation } = context;
	const [ isResizing, setIsResizing ] = useState( false );
	const { height, width, heightUnit, widthUnit } = attributes;

	const heightWithUnit = heightUnit ? `${ height }${ heightUnit }` : height;
	const widthWithUnit = widthUnit ? `${ width }${ widthUnit }` : width;

	const updateHeight = ( nextHeight ) => {
		nextHeight = 0 > parseFloat( nextHeight ) ? '0' : nextHeight;
		setAttributes( {
			height: nextHeight,
		} );
	};
	const updateWidth = ( nextWidth ) => {
		nextWidth = 0 > parseFloat( nextWidth ) ? '0' : nextWidth;
		setAttributes( {
			width: nextWidth,
		} );
	};

	const handleOnResizeStart = ( _event, _direction, elt ) => {
		onResizeStart( _event, _direction, elt );
		setIsResizing( true );
	};

	const handleOnVerticalResizeStop = ( event, direction, elt, delta ) => {
		onResizeStop();
		const spacerHeight = Math.min(
			parseInt( height + delta.height, 10 ),
			MAX_SPACER_HEIGHT
		);
		updateHeight( spacerHeight );
		setIsResizing( false );
	};

	const handleOnHorizontalResizeStop = ( event, direction, elt, delta ) => {
		onResizeStop();
		const spacerWidth = Math.min(
			parseInt( width + delta.width, 10 ),
			MAX_SPACER_WIDTH
		);
		updateWidth( spacerWidth );
		setIsResizing( false );
	};

	const resizableBoxWithOrientation = ( blockOrientation ) => {
		if ( blockOrientation === 'horizontal' ) {
			return (
				<ResizableBox
					className={ classnames(
						'block-library-spacer__resize-container',
						'resize-horizontal',
						{
							'is-selected': isSelected,
						}
					) }
					size={ {
						width: widthWithUnit,
						height: heightWithUnit,
					} }
					minWidth={ MIN_SPACER_WIDTH }
					enable={ {
						top: false,
						right: true,
						bottom: false,
						left: false,
						topRight: false,
						bottomRight: false,
						bottomLeft: false,
						topLeft: false,
					} }
					onResizeStart={ handleOnResizeStart }
					onResizeStop={ handleOnHorizontalResizeStop }
					showHandle={ isSelected }
					__experimentalShowTooltip={ true }
					__experimentalTooltipProps={ {
						axis: 'x',
						position: 'corner',
						isVisible: isResizing,
					} }
				/>
			);
		}

		return (
			<ResizableBox
				className={ classnames(
					'block-library-spacer__resize-container',
					{
						'is-selected': isSelected,
					}
				) }
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
				onResizeStop={ handleOnVerticalResizeStop }
				showHandle={ isSelected }
				__experimentalShowTooltip={ true }
				__experimentalTooltipProps={ {
					axis: 'y',
					position: 'bottom',
					isVisible: isResizing,
				} }
			/>
		);
	};

	useEffect( () => {
		if ( orientation === 'horizontal' && ! width ) {
			updateWidth( 72 );
			updateHeight( 0 );
		}
	}, [] );

	const style = {
		height: orientation === 'horizontal' ? 24 : heightWithUnit || undefined,
		width: orientation === 'horizontal' ? widthWithUnit : undefined,
	};
	return (
		<>
			<View { ...useBlockProps() } style={ style }>
				{ resizableBoxWithOrientation( orientation ) }
			</View>
			<InspectorControls>
				<PanelBody title={ __( 'Spacer settings' ) }>
					{ orientation === 'horizontal' && (
						<DimensionInput
							label={ __( 'Width in pixels' ) }
							value={ width }
							unit={ widthUnit }
							onChange={ ( nextWidth ) =>
								setAttributes( { width: nextWidth } )
							}
							onChangeUnit={ ( nextUnit ) =>
								setAttributes( {
									widthUnit: nextUnit,
								} )
							}
						/>
					) }
					{ orientation !== 'horizontal' && (
						<DimensionInput
							label={ __( 'Height in pixels' ) }
							value={ height }
							unit={ heightUnit }
							onChange={ ( newHeight ) =>
								setAttributes( { height: newHeight } )
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
		</>
	);
};

export default compose( [
	withDispatch( ( dispatch ) => {
		const { toggleSelection } = dispatch( blockEditorStore );

		return {
			onResizeStart: () => toggleSelection( false ),
			onResizeStop: () => toggleSelection( true ),
		};
	} ),
	withInstanceId,
] )( SpacerEdit );
