/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	getCustomValueFromPreset,
	getSpacingPresetCssVar,
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { ResizableBox } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { View } from '@wordpress/primitives';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import SpacerControls from './controls';
import { MIN_SPACER_SIZE } from './constants';

const { useSpacingSizes } = unlock( blockEditorPrivateApis );

const ResizableSpacer = ( {
	orientation,
	onResizeStart,
	onResize,
	onResizeStop,
	isSelected,
	isResizing,
	setIsResizing,
	...props
} ) => {
	const getCurrentSize = ( elt ) => {
		return orientation === 'horizontal'
			? elt.clientWidth
			: elt.clientHeight;
	};

	const getNextVal = ( elt ) => {
		return `${ getCurrentSize( elt ) }px`;
	};

	return (
		<ResizableBox
			className={ clsx( 'block-library-spacer__resize-container', {
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
				const nextVal = getCurrentSize( elt );
				onResizeStop( `${ nextVal }px` );
				setIsResizing( false );
			} }
			__experimentalShowTooltip
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
	toggleSelection,
	context,
	__unstableParentLayout: parentLayout,
	className,
} ) => {
	const disableCustomSpacingSizes = useSelect( ( select ) => {
		const editorSettings = select( blockEditorStore ).getSettings();
		return editorSettings?.disableCustomSpacingSizes;
	} );
	const { orientation } = context;
	const {
		orientation: parentOrientation,
		type,
		default: { type: defaultType } = {},
	} = parentLayout || {};
	// Check if the spacer is inside a flex container.
	const isFlexLayout =
		type === 'flex' || ( ! type && defaultType === 'flex' );
	// If the spacer is inside a flex container, it should either inherit the orientation
	// of the parent or use the flex default orientation.
	const inheritedOrientation =
		! parentOrientation && isFlexLayout
			? 'horizontal'
			: parentOrientation || orientation;
	const { height, width, style: blockStyle = {} } = attributes;

	const { layout = {} } = blockStyle;
	const { selfStretch, flexSize } = layout;

	const spacingSizes = useSpacingSizes();

	const [ isResizing, setIsResizing ] = useState( false );
	const [ temporaryHeight, setTemporaryHeight ] = useState( null );
	const [ temporaryWidth, setTemporaryWidth ] = useState( null );

	const onResizeStart = () => toggleSelection( false );
	const onResizeStop = () => toggleSelection( true );

	const handleOnVerticalResizeStop = ( newHeight ) => {
		onResizeStop();

		if ( isFlexLayout ) {
			setAttributes( {
				style: {
					...blockStyle,
					layout: {
						...layout,
						flexSize: newHeight,
						selfStretch: 'fixed',
					},
				},
			} );
		}

		setAttributes( { height: newHeight } );
		setTemporaryHeight( null );
	};

	const handleOnHorizontalResizeStop = ( newWidth ) => {
		onResizeStop();

		if ( isFlexLayout ) {
			setAttributes( {
				style: {
					...blockStyle,
					layout: {
						...layout,
						flexSize: newWidth,
						selfStretch: 'fixed',
					},
				},
			} );
		}

		setAttributes( { width: newWidth } );
		setTemporaryWidth( null );
	};

	const getHeightForVerticalBlocks = () => {
		if ( isFlexLayout ) {
			return undefined;
		}
		return temporaryHeight || getSpacingPresetCssVar( height ) || undefined;
	};

	const getWidthForHorizontalBlocks = () => {
		if ( isFlexLayout ) {
			return undefined;
		}
		return temporaryWidth || getSpacingPresetCssVar( width ) || undefined;
	};

	const sizeConditionalOnOrientation =
		inheritedOrientation === 'horizontal'
			? temporaryWidth || flexSize
			: temporaryHeight || flexSize;

	const style = {
		height:
			inheritedOrientation === 'horizontal'
				? 24
				: getHeightForVerticalBlocks(),
		width:
			inheritedOrientation === 'horizontal'
				? getWidthForHorizontalBlocks()
				: undefined,
		// In vertical flex containers, the spacer shrinks to nothing without a minimum width.
		minWidth:
			inheritedOrientation === 'vertical' && isFlexLayout
				? 48
				: undefined,
		// Add flex-basis so temporary sizes are respected.
		flexBasis: isFlexLayout ? sizeConditionalOnOrientation : undefined,
		// Remove flex-grow when resizing.
		flexGrow: isFlexLayout && isResizing ? 0 : undefined,
	};

	const resizableBoxWithOrientation = ( blockOrientation ) => {
		if ( blockOrientation === 'horizontal' ) {
			return (
				<ResizableSpacer
					minWidth={ MIN_SPACER_SIZE }
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
					onResizeStart={ onResizeStart }
					onResize={ setTemporaryWidth }
					onResizeStop={ handleOnHorizontalResizeStop }
					isSelected={ isSelected }
					isResizing={ isResizing }
					setIsResizing={ setIsResizing }
				/>
			);
		}

		return (
			<>
				<ResizableSpacer
					minHeight={ MIN_SPACER_SIZE }
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
					onResizeStart={ onResizeStart }
					onResize={ setTemporaryHeight }
					onResizeStop={ handleOnVerticalResizeStop }
					isSelected={ isSelected }
					isResizing={ isResizing }
					setIsResizing={ setIsResizing }
				/>
			</>
		);
	};

	useEffect( () => {
		if (
			isFlexLayout &&
			selfStretch !== 'fill' &&
			selfStretch !== 'fit' &&
			! flexSize
		) {
			if ( inheritedOrientation === 'horizontal' ) {
				// If spacer is moving from a vertical container to a horizontal container,
				// it might not have width but have height instead.
				const newSize =
					getCustomValueFromPreset( width, spacingSizes ) ||
					getCustomValueFromPreset( height, spacingSizes ) ||
					'100px';
				setAttributes( {
					width: '0px',
					style: {
						...blockStyle,
						layout: {
							...layout,
							flexSize: newSize,
							selfStretch: 'fixed',
						},
					},
				} );
			} else {
				const newSize =
					getCustomValueFromPreset( height, spacingSizes ) ||
					getCustomValueFromPreset( width, spacingSizes ) ||
					'100px';
				setAttributes( {
					height: '0px',
					style: {
						...blockStyle,
						layout: {
							...layout,
							flexSize: newSize,
							selfStretch: 'fixed',
						},
					},
				} );
			}
		} else if (
			isFlexLayout &&
			( selfStretch === 'fill' || selfStretch === 'fit' )
		) {
			if ( inheritedOrientation === 'horizontal' ) {
				setAttributes( {
					width: undefined,
				} );
			} else {
				setAttributes( {
					height: undefined,
				} );
			}
		} else if ( ! isFlexLayout && ( selfStretch || flexSize ) ) {
			if ( inheritedOrientation === 'horizontal' ) {
				setAttributes( {
					width: flexSize,
				} );
			} else {
				setAttributes( {
					height: flexSize,
				} );
			}
			setAttributes( {
				style: {
					...blockStyle,
					layout: {
						...layout,
						flexSize: undefined,
						selfStretch: undefined,
					},
				},
			} );
		}
	}, [
		blockStyle,
		flexSize,
		height,
		inheritedOrientation,
		isFlexLayout,
		layout,
		selfStretch,
		setAttributes,
		spacingSizes,
		width,
	] );

	return (
		<>
			<View
				{ ...useBlockProps( {
					style,
					className: clsx( className, {
						'custom-sizes-disabled': disableCustomSpacingSizes,
					} ),
				} ) }
			>
				{ resizableBoxWithOrientation( inheritedOrientation ) }
			</View>
			{ ! isFlexLayout && (
				<SpacerControls
					setAttributes={ setAttributes }
					height={ temporaryHeight || height }
					width={ temporaryWidth || width }
					orientation={ inheritedOrientation }
					isResizing={ isResizing }
				/>
			) }
		</>
	);
};

export default SpacerEdit;
