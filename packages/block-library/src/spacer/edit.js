/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ResizableBox } from '@wordpress/components';
import { compose, withInstanceId } from '@wordpress/compose';
import { withDispatch } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { View } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import SpacerControls from './controls';

export const MIN_SPACER_HEIGHT = 1;
export const MAX_SPACER_HEIGHT = 500;

export const MIN_SPACER_WIDTH = 1;
export const MAX_SPACER_WIDTH = 500;

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
			<SpacerControls
				setAttributes={ setAttributes }
				height={ temporaryHeight || height }
				heightUnit={ heightUnit }
				width={ temporaryWidth || width }
				widthUnit={ widthUnit }
				orientation={ orientation }
			/>
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
