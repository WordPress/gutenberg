/**
 * WordPress dependencies
 */
import { __experimentalSpacingSizesBoxControl as SpacingSizesBoxControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import useSetting from '../components/use-setting';

export function getSpacingPresetCssVar( value ) {
	if ( ! value ) {
		return;
	}
	const slug = /var:preset\|spacing\|(.+)/.exec( value );
	if ( ! slug ) {
		return value;
	}
	return `var(--wp--preset--spacing--${ slug[ 1 ] })`;
}

/**
 * Inspector control panel containing the spacing size related configuration
 *
 * @param {Object} props
 *
 * @return {WPElement} Font size edit element.
 */
export function SpacingSizeEdit( props ) {
	const spacingSizes = useSetting( 'spacing.spacingSizes' );

	return (
		<>
			<SpacingSizesBoxControl
				values={ props.value }
				// onChange={ props.onChange }
				label={ props.label }
				sides={ props.sides }
				allowReset={ false }
				splitOnAxis={ props.splitOnAxis }
				onChange={ props.onChange }
				withInputField={ false }
				spacingSizes={ spacingSizes }
				// ariaValueNow={ valueNow }
				// ariaValueText={ spacingSizes[ valueNow ]?.name }
				// renderTooltipContent={ customTooltipContent }
			/>
		</>
	);
}
