/**
 * WordPress dependencies
 */
import { HorizontalRule, useConvertUnitToMobile } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { withColors, useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import SeparatorSettings from './separator-settings';
import { getMarginConstraints, parseUnit } from './shared';

function SeparatorEdit( props ) {
	const { attributes, setAttributes, color, setColor } = props;
	const { className, style } = attributes;

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
			marginTopValue < currentMinMargin ||
			marginBottomValue < currentMinMargin
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

	const blockProps = useBlockProps();

	const convertedMarginTop = useConvertUnitToMobile(
		marginTopValue || currentMinMargin,
		marginUnit
	);

	const convertedMarginBottom = useConvertUnitToMobile(
		marginBottomValue || currentMinMargin,
		marginUnit
	);

	// The block's className and styles are moved to the inner <hr> to retain
	// the different styling approaches between themes. The use of bottom
	// borders and background colors prevents using padding internally on the
	// edit component. Adjusting margins leads to losing visual indicators for
	// block selection.
	return (
		<>
			<HorizontalRule
				{ ...blockProps }
				style={ {
					backgroundColor: color.color,
					color: color.color,
					marginTop: convertedMarginTop,
					marginBottom: convertedMarginBottom,
				} }
			/>
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
