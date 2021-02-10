/**
 * External dependencies
 */
import classnames from 'classnames';
import { clamp } from 'lodash';

/**
 * WordPress dependencies
 */
import { HorizontalRule, ResizableBox } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { withColors, useBlockProps } from '@wordpress/block-editor';
import { View } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import SeparatorSettings from './separator-settings';
import { getHeightConstraints } from './shared';

function SeparatorEdit( props ) {
	const { attributes, setAttributes, color, setColor, isSelected } = props;
	const { height, heightUnit } = attributes;
	const [ isResizing, setIsResizing ] = useState( false );

	const hasDotsStyle = attributes.className?.indexOf( 'is-style-dots' ) >= 0;
	const minimumHeightScale = hasDotsStyle ? 1.5 : 1;
	const heightConstraints = getHeightConstraints( minimumHeightScale );
	const currentMinHeight = heightConstraints[ heightUnit ].min;
	const currentMaxHeight = heightConstraints[ heightUnit ].max;

	useEffect( () => {
		if ( height && height < currentMinHeight ) {
			setAttributes( { height: currentMinHeight } );
		}
	}, [ hasDotsStyle ] ); // Only restricting on dots style as min/max enforced on change otherwise.

	const onResizeStart = () => {
		setIsResizing( true );
	};

	// Change handler for sidebar height control only.
	const updateHeight = ( value ) => {
		setAttributes( {
			height: clamp(
				parseFloat( value ), // Rounding or parsing as integer here isn't ideal for em and rem units.
				currentMinHeight,
				currentMaxHeight
			),
			heightUnit,
		} );
	};

	const updateHeightUnit = ( value ) => {
		setAttributes( {
			height: heightConstraints[ value ].default,
			heightUnit: value,
		} );
	};

	// ResizableBox callback to set height and force pixel units.
	const onResizeStop = ( _event, _direction, elt ) => {
		setAttributes( {
			height: clamp(
				parseInt( elt.clientHeight, 10 ),
				heightConstraints.px.min,
				heightConstraints.px.max
			),
			heightUnit: 'px',
		} );
		setIsResizing( false );
	};

	const cssHeight = `${ height }${ heightUnit }`;
	const blockProps = useBlockProps();
	const wrapperClasses = blockProps.className?.replace(
		'wp-block-separator',
		'wp-block-separator__wrapper'
	);

	// The block's className and styles are moved to the inner <hr> to retain
	// the different styling approaches between themes. The use of bottom
	// borders and background colors prevents using padding internally on the
	// edit component. Adjusting margins leads to losing visual indicators for
	// block selection.
	return (
		<>
			<View
				{ ...blockProps }
				className={ wrapperClasses }
				style={ { height: height ? cssHeight : currentMinHeight } }
			>
				<HorizontalRule
					className={ classnames( blockProps.className, {
						'has-background': color.color,
						[ color.class ]: color.class,
					} ) }
					style={ {
						backgroundColor: color.color,
						color: color.color,
					} }
				/>
				<ResizableBox
					className={ classnames(
						'block-library-separator__resize-container',
						{
							'is-selected': isSelected,
						}
					) }
					size={ {
						height:
							heightUnit === 'px' && height ? cssHeight : '100%',
					} }
					enable={ {
						top: false,
						right: false,
						bottom: true, // Only enable bottom handle.
						left: false,
						topRight: false,
						bottomRight: false,
						bottomLeft: false,
						topLeft: false,
					} }
					minHeight={ heightConstraints.px.min }
					onResizeStart={ onResizeStart }
					onResizeStop={ onResizeStop }
					showHandle={ isSelected }
					__experimentalShowTooltip={ true }
					__experimentalTooltipProps={ {
						axis: 'y',
						position: 'bottom',
						isVisible: isResizing,
					} }
				/>
			</View>
			<SeparatorSettings
				color={ color }
				setColor={ setColor }
				minHeight={ currentMinHeight }
				maxHeight={ currentMaxHeight }
				height={ height }
				heightUnit={ heightUnit }
				updateHeight={ updateHeight }
				updateHeightUnit={ updateHeightUnit }
			/>
		</>
	);
}

export default withColors( 'color', { textColor: 'color' } )( SeparatorEdit );
