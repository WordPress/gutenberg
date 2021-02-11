/**
 * External dependencies
 */
import classnames from 'classnames';

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
import {
	MARGIN_CONSTRAINTS,
	calculateMargins,
	getHeightFromStyle,
	parseUnit,
} from './shared';

function SeparatorEdit( props ) {
	const [ isResizing, setIsResizing ] = useState( false );
	const {
		attributes: { style },
		setAttributes,
		color,
		setColor,
		isSelected,
	} = props;

	const { top, bottom } = style?.spacing?.margin || {};
	const marginUnit = parseUnit( top || bottom );
	const { height, cssHeight } = getHeightFromStyle( style, marginUnit );

	// ResizableBox callback to set height and force pixel units.
	const onResize = ( _event, _direction, elt ) => {
		const newHeight = parseInt( elt.clientHeight, 10 );
		setAttributes( {
			style: {
				...style,
				spacing: {
					...style?.spacing,
					margin: calculateMargins( newHeight, top, bottom ),
				},
			},
		} );
	};

	const blockProps = useBlockProps();

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
				style={ {
					height: height
						? cssHeight
						: MARGIN_CONSTRAINTS.px.minHeight,
				} }
			>
				<HorizontalRule
					className={ classnames( blockProps.className, {
						'has-background': color.color,
						[ color.class ]: color.class,
					} ) }
					style={ {
						backgroundColor: color.color,
						color: color.color,
						marginTop: top || MARGIN_CONSTRAINTS[ marginUnit ].min,
						marginBottom:
							bottom || MARGIN_CONSTRAINTS[ marginUnit ].min,
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
							marginUnit === 'px' && height ? cssHeight : '100%',
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
					minHeight={ MARGIN_CONSTRAINTS.px.min * 2 } // Height will account for top and bottom margin.
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
				marginUnit={ marginUnit }
				separatorStyles={ style }
				setAttributes={ setAttributes }
			/>
		</>
	);
}

export default withColors( 'color', { textColor: 'color' } )( SeparatorEdit );
