/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalToolsPanel as ToolsPanel,
	DuotonePicker,
} from '@wordpress/components';
import {
	privateApis as blockEditorPrivateApis,
	useSetting,
} from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../private-apis';
const { useGlobalStyle } = unlock( blockEditorPrivateApis );

const EMPTY_ARRAY = [];

function useMultiOriginPresets( { presetSetting, defaultSetting } ) {
	const disableDefault = ! useSetting( defaultSetting );
	const userPresets =
		useSetting( `${ presetSetting }.custom` ) || EMPTY_ARRAY;
	const themePresets =
		useSetting( `${ presetSetting }.theme` ) || EMPTY_ARRAY;
	const defaultPresets =
		useSetting( `${ presetSetting }.default` ) || EMPTY_ARRAY;
	return useMemo(
		() => [
			...userPresets,
			...themePresets,
			...( disableDefault ? EMPTY_ARRAY : defaultPresets ),
		],
		[ disableDefault, userPresets, themePresets, defaultPresets ]
	);
}

function ScreenDuotone( { name } ) {
	const [ themeDuotone, setThemeDuotone ] = useGlobalStyle(
		'filter.duotone',
		name
	);

	const duotonePalette = useMultiOriginPresets( {
		presetSetting: 'color.duotone',
		defaultSetting: 'color.defaultDuotone',
	} );
	const colorPalette = useMultiOriginPresets( {
		presetSetting: 'color.palette',
		defaultSetting: 'color.defaultPalette',
	} );
	const disableCustomColors = ! useSetting( 'color.custom' );
	const disableCustomDuotone =
		! useSetting( 'color.customDuotone' ) ||
		( colorPalette?.length === 0 && disableCustomColors );

	if ( duotonePalette?.length === 0 && disableCustomDuotone ) {
		return null;
	}
	return (
		<>
			<ToolsPanel label={ __( 'Duotone' ) } headingLevel={ 3 }>
				<span className="span-columns">
					{ __(
						'Create a two-tone color effect without losing your original image.'
					) }
				</span>
				<div className="span-columns">
					<DuotonePicker
						colorPalette={ colorPalette }
						duotonePalette={ duotonePalette }
						disableCustomColors={ disableCustomColors }
						disableCustomDuotone={ disableCustomDuotone }
						value={ themeDuotone }
						onChange={ setThemeDuotone }
					/>
				</div>
			</ToolsPanel>
		</>
	);
}

export default ScreenDuotone;
