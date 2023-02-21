/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { DuotonePicker } from '@wordpress/components';
import { useSetting } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';

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

function ScreenDuotone() {
	const duotone = 'unset';

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
			<ScreenHeader title={ __( 'Duotone panel!' ) } />
			<div className="edit-site-global-styles-screen-filters">
				<DuotonePicker
					colorPalette={ colorPalette }
					duotonePalette={ duotonePalette }
					disableCustomColors={ disableCustomColors }
					disableCustomDuotone={ disableCustomDuotone }
					value={ duotone }
				/>
			</div>
		</>
	);
}

export default ScreenDuotone;
