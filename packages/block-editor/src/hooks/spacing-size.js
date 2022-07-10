/**
 * Internal dependencies
 */
import useSetting from '../components/use-setting';
import { __experimentalSpacingSizesControl as SpacingSizesControl } from '../components/';
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
			{
				<SpacingSizesControl
					values={ props.values }
					label={ props.label }
					sides={ props.sides }
					allowReset={ false }
					splitOnAxis={ props.splitOnAxis }
					onChange={ props.onChange }
					withInputField={ false }
					spacingSizes={ spacingSizes }
				/>
			}
		</>
	);
}
