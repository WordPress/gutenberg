import {
	getSupportedGlobalStylesPanels,
	useSetting,
} from "@wordpress/packages/edit-site/src/components/global-styles/hooks";

function useCanCustomizeColor( name, isEnabledSetting, isSupportIncluded ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const [ solids ] = useSetting( 'color.palette', name );
	const [ areCustomSolidsEnabled ] = useSetting( 'color.custom', name );

	const [ isTextEnabled ] = useSetting( isEnabledSetting, name );

	return (
		supports.includes( isSupportIncluded ) &&
		isTextEnabled &&
		( solids.length > 0 || areCustomSolidsEnabled )
	);
}
