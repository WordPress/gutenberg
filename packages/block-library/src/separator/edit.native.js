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
		color,
		attributes: { style },
	} = props;

	const { top, bottom } = style?.spacing?.margin || {};
	const marginUnit = parseUnit( top || bottom );

	const convertedMarginTop = useConvertUnitToMobile(
		parseFloat( top || 0 ) || MARGIN_CONSTRAINTS[ marginUnit ].min,
		marginUnit
	);

	const convertedMarginBottom = useConvertUnitToMobile(
		parseFloat( bottom || 0 ) || MARGIN_CONSTRAINTS[ marginUnit ].min,
		marginUnit
	);

	return (
		<>
			<HorizontalRule
				{ ...useBlockProps() }
				style={ {
					backgroundColor: color.color,
					color: color.color,
					marginBottom: convertedMarginBottom,
					marginTop: convertedMarginTop,
				} }
			/>
			<SeparatorSettings { ...props } />
		</>
	);
}

export default withColors( 'color', { textColor: 'color' } )( SeparatorEdit );
