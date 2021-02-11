/**
 * External dependencies
 */
import classnames from 'classnames';
import { clamp } from 'lodash';

/**
 * WordPress dependencies
 */
import { HorizontalRule, ResizableBox } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { withColors, useBlockProps } from '@wordpress/block-editor';
import { View } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import SeparatorSettings from './separator-settings';
import { HEIGHT_CONSTRAINTS } from './shared';

function SeparatorEdit( props ) {
	const { attributes, setAttributes, color, setColor, isSelected } = props;
	const { height, heightUnit } = attributes;
	const [ isResizing, setIsResizing ] = useState( false );

	const currentMinHeight = HEIGHT_CONSTRAINTS[ heightUnit ].min;
	const currentMaxHeight = HEIGHT_CONSTRAINTS[ heightUnit ].max;

	// Resize handler for when user is drag resizing block via ResizableBlock.
	const onResize = ( _event, _direction, elt ) => {
		setAttributes( {
			height: clamp(
				parseInt( elt.clientHeight, 10 ),
				HEIGHT_CONSTRAINTS.px.min,
				HEIGHT_CONSTRAINTS.px.max
			),
			heightUnit: 'px',
		} );
	};

	const cssHeight = `${ height }${ heightUnit }`;
	const blockProps = useBlockProps();
	const margin = height
		? `${ height / 2 }${ heightUnit }`
		: `${ currentMinHeight / 2 }${ heightUnit }`;

	// The block's className and styles are moved to the inner <hr> to retain
	// the different styling approaches between themes. The use of bottom
	// borders and background colors prevents using padding internally on the
	// edit component. Adjusting margins leads to losing visual indicators for
	// block selection.
	return (
		<>
			<View
				{ ...blockProps }
				className={ blockProps.className?.replace(
					'wp-block-separator',
					'wp-block-separator__wrapper'
				) }
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
						marginTop: margin,
						marginBottom: margin,
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
					minHeight={ HEIGHT_CONSTRAINTS.px.min }
					onResizeStart={ () => setIsResizing( true ) }
					onResize={ onResize }
					onResizeStop={ ( ...args ) => {
						onResize( ...args );
						setIsResizing( false );
					} }
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
				setAttributes={ setAttributes }
			/>
		</>
	);
}

export default withColors( 'color', { textColor: 'color' } )( SeparatorEdit );
