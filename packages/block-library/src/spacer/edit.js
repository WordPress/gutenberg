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

const ResizableSpacer = ( {
	orientation,
	max,
	onResizeStart,
	onResize,
	onResizeStop,
	isSelected,
	...props
} ) => {
	const [ isResizing, setIsResizing ] = useState( false );

	const getNextVal = ( elt ) => {
		return orientation === 'horizontal'
			? elt.clientWidth
			: elt.clientHeight;
	};

	return (
		<ResizableBox
			className={ classnames( 'block-library-spacer__resize-container', {
				'resize-horizontal': orientation === 'horizontal',
				'is-resizing': isResizing,
				'is-selected': isSelected,
			} ) }
			onResizeStart={ ( _event, _direction, elt ) => {
				const nextVal = getNextVal( elt );
				onResizeStart( nextVal );
				onResize( nextVal );
			} }
			onResize={ ( _event, _direction, elt ) => {
				onResize( getNextVal( elt ) );
				if ( ! isResizing ) {
					setIsResizing( true );
				}
			} }
			onResizeStop={ ( _event, _direction, elt ) => {
				onResizeStop( Math.min( getNextVal( elt ), max ) );
				setIsResizing( false );
			} }
			__experimentalShowTooltip={ true }
			__experimentalTooltipProps={ {
				axis: orientation === 'horizontal' ? 'x' : 'y',
				position: 'corner',
				isVisible: isResizing,
			} }
			showHandle={ isSelected }
			{ ...props }
		/>
	);
};

const SpacerEdit = ( {
	attributes,
	isSelected,
	setAttributes,
	onResizeStart,
	onResizeStop,
	context,
} ) => {
	const { orientation } = context;
	const { height, width, heightUnit, widthUnit } = attributes;

	const [ temporaryHeight, setTemporaryHeight ] = useState( null );
	const [ temporaryWidth, setTemporaryWidth ] = useState( null );

	const heightWithUnit = heightUnit ? `${ height }${ heightUnit }` : height;
	const widthWithUnit = widthUnit ? `${ width }${ widthUnit }` : width;

	const handleOnResizeStart = ( _event, _direction, elt ) => {
		setAttributes( {
			heightUnit: 'px',
			widthUnit: 'px',
		} );

		onResizeStart( _event, _direction, elt );
	};

	const handleOnVerticalResizeStop = ( newHeight ) => {
		onResizeStop();

		setAttributes( { height: newHeight } );
		setTemporaryHeight( null );
	};

	const handleOnHorizontalResizeStop = ( newWidth ) => {
		onResizeStop();
		setAttributes( { width: newWidth } );
		setTemporaryWidth( null );
	};

	const style = {
		height:
			orientation === 'horizontal'
				? 24
				: temporaryHeight || heightWithUnit || undefined,
		width:
			orientation === 'horizontal'
				? temporaryWidth || widthWithUnit || undefined
				: undefined,
	};

	const resizableBoxWithOrientation = ( blockOrientation ) => {
		if ( blockOrientation === 'horizontal' ) {
			return (
				<ResizableSpacer
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
					orientation={ blockOrientation }
					max={ MAX_SPACER_WIDTH }
					onResizeStart={ handleOnResizeStart }
					onResize={ setTemporaryWidth }
					onResizeStop={ handleOnHorizontalResizeStop }
					isSelected={ isSelected }
				/>
			);
		}

		return (
			<>
				<ResizableSpacer
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
					orientation={ blockOrientation }
					max={ MAX_SPACER_HEIGHT }
					onResizeStart={ handleOnResizeStart }
					onResize={ setTemporaryHeight }
					onResizeStop={ handleOnVerticalResizeStop }
					isSelected={ isSelected }
				/>
			</>
		);
	};

	useEffect( () => {
		if ( orientation === 'horizontal' && ! width ) {
			setAttributes( {
				height: parseFloat( 0 ),
				heightUnit: 'px',
				width: parseFloat( 72 ),
				widthUnit: 'px',
			} );
		}
	}, [] );

	return (
		<>
			<View { ...useBlockProps() } style={ style }>
				{ resizableBoxWithOrientation( orientation ) }
			</View>
			<InspectorControls>
				<PanelBody title={ __( 'Spacer settings' ) }>
					{ orientation === 'horizontal' && (
						<DimensionInput
							label={ __( 'Width' ) }
							value={ temporaryWidth || width }
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
							value={ temporaryHeight || height }
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
