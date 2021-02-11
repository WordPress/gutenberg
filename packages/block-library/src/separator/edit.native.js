/**
 * WordPress dependencies
 */
import { HorizontalRule, useConvertUnitToMobile } from '@wordpress/components';
import { withColors, useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import SeparatorSettings from './separator-settings';
import { MARGIN_CONSTRAINTS, parseUnit } from './shared';

function SeparatorEdit( props ) {
	const {
		attributes: { style },
		setAttributes,
		color,
		setColor,
	} = props;

	const { top, bottom } = style?.spacing?.margin || {};
	const marginUnit = parseUnit( top || bottom );
	const currentMinMargin = MARGIN_CONSTRAINTS[ marginUnit ].min;

	const convertedMarginTop = useConvertUnitToMobile(
		parseFloat( top || 0 ) || currentMinMargin,
		marginUnit
	);

	const convertedMarginBottom = useConvertUnitToMobile(
		parseFloat( bottom || 0 ) || currentMinMargin,
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
				{ ...useBlockProps() }
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
				marginUnit={ marginUnit }
				separatorStyles={ style }
				setAttributes={ setAttributes }
			/>
		</>
	);
}

export default withColors( 'color', { textColor: 'color' } )( SeparatorEdit );
