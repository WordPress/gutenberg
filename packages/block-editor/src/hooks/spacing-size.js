/**
 * WordPress dependencies
 */
import { RangeControl } from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useSetting from '../components/use-setting';

export function getSpacingPresetCssVar( presetVar ) {
	if ( ! presetVar ) {
		return;
	}
	const slug = /var:preset\|spacing\|(.+)/.exec( presetVar );
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
	const [ valueNow, setValueNow ] = useState( null );
	const spacingSizes = useSetting( 'spacing.spacingSizes' );
	const customTooltipContent = ( value ) => spacingSizes[ value ].name;
	return (
		<>
			<RangeControl
				label="Padding"
				value=""
				onChange={ ( newSize ) => {
					setValueNow( newSize );
					props.onChange(
						`var:preset|spacing|${ spacingSizes[ newSize ].slug }`
					);
				} }
				min={ 0 }
				max={ spacingSizes.length - 1 }
				withInputField={ false }
				aria-valuenow={ valueNow }
				aria-valuetext={ spacingSizes[ valueNow ]?.name }
				renderTooltipContent={ customTooltipContent }
			/>
		</>
	);
}
