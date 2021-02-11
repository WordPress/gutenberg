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
import { getMarginConstraints, parseUnit } from './shared';

function SeparatorEdit( props ) {
	const { attributes, setAttributes, color, setColor, isSelected } = props;
	const { className, style } = attributes;
	const [ isResizing, setIsResizing ] = useState( false );

	const { top: marginTop, bottom: marginBottom } =
		style?.spacing?.margin || {};
	const marginUnit = parseUnit( marginTop || marginBottom );
	const marginTopValue = parseFloat( marginTop || 0 );
	const marginBottomValue = parseFloat( marginBottom || 0 );

	// Given different display method, dots block style has larger min height requirement.
	const hasDotsStyle = className?.indexOf( 'is-style-dots' ) >= 0;
	const minimumMarginScale = hasDotsStyle ? 1.5 : 1;
	const marginConstraints = getMarginConstraints( minimumMarginScale );
	const currentMinMargin = marginConstraints[ marginUnit ].min;

	// Ensure when changing block style that any change in minimum height is
	// enforced against existing top and bottom margins.
	useEffect( () => {
		if (
			( marginTopValue || marginBottomValue ) &&
			( marginTopValue < currentMinMargin ||
				marginBottomValue < currentMinMargin )
		) {
			const topValue = Math.max( marginTopValue, currentMinMargin );
			const bottomValue = Math.max( marginBottomValue, currentMinMargin );

			setAttributes( {
				style: {
					...style,
					spacing: {
						...style?.spacing,
						margin: {
							top: `${ topValue }${ marginUnit }`,
							bottom: `${ bottomValue }${ marginUnit }`,
						},
					},
				},
			} );
		}
	}, [ hasDotsStyle ] ); // Only restricting on dots style as min/max enforced on change otherwise.

	// ResizableBox callback to set height and force pixel units.
	const onResize = ( _event, _direction, elt ) => {
		const { min, max } = marginConstraints.px;
		const newHeight = clamp( parseInt( elt.clientHeight, 10 ) );

		// Split the resizable box's height between margins by default.
		let top = Math.floor( newHeight / 2 );
		let bottom = Math.ceil( newHeight / 2 );

		// Handle existing ratio between top and bottom margins if available.
		if ( marginTop && marginBottom ) {
			const totalMargin = marginTopValue + marginBottomValue;
			top = newHeight * ( marginTopValue / totalMargin );
			bottom = newHeight * ( marginBottomValue / totalMargin );
		}

		// Enforce min and max margins.
		top = clamp( Math.round( top ), min, max );
		bottom = clamp( Math.round( bottom ), min, max );

		setAttributes( {
			style: {
				...style,
				spacing: {
					...style?.spacing,
					margin: {
						top: `${ top }px`,
						bottom: `${ bottom }px`,
					},
				},
			},
		} );
	};

	const onResizeStop = ( ...args ) => {
		onResize( ...args );
		setIsResizing( false );
	};

	const height =
		parseFloat( marginTop || 0 ) + parseFloat( marginBottom || 0 );
	const minCSSHeight = `${ marginConstraints.px.min * 2 }${ marginUnit }`;
	const cssHeight = `${ height }${ marginUnit }`;
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
				style={ { height: height ? cssHeight : minCSSHeight } }
			>
				<HorizontalRule
					className={ classnames( blockProps.className, {
						'has-background': color.color,
						[ color.class ]: color.class,
					} ) }
					style={ {
						backgroundColor: color.color,
						color: color.color,
						marginTop: marginTop || currentMinMargin,
						marginBottom: marginBottom || currentMinMargin,
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
					minHeight={ marginConstraints.px.min * 2 } // Height will account for top and bottom margin.
					onResizeStart={ () => setIsResizing( true ) }
					onResize={ onResize }
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
				marginConstraints={ marginConstraints }
				marginUnit={ marginUnit }
				separatorStyles={ style }
				setAttributes={ setAttributes }
			/>
		</>
	);
}

export default withColors( 'color', { textColor: 'color' } )( SeparatorEdit );
