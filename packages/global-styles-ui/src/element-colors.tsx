// @ts-expect-error: Not typed yet.
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import type {
	GlobalStylesSettings,
	GlobalStylesStyles,
} from '@wordpress/global-styles-engine';
import { useSetting, useStyle } from './hooks';
import { unlock } from './lock-unlock';

const { useSettingsForBlockElement, ColorPanel: StylesColorPanel } = unlock(
	blockEditorPrivateApis
);

interface ElementColorsProps {
	additionalElements: { name: string; label: string }[];
	defaultControls: Record< string, boolean >;
	settingsTransform?: (
		settings: GlobalStylesSettings
	) => GlobalStylesSettings;
	label?: string;
}

export function ElementColors( {
	additionalElements,
	defaultControls,
	settingsTransform = ( settings ) => settings,
	label,
}: ElementColorsProps ) {
	const [ style, setStyle ] = useStyle< GlobalStylesStyles >(
		'',
		undefined,
		'user',
		false
	);
	const [ inheritedStyle ] = useStyle< GlobalStylesStyles >(
		'',
		undefined,
		'merged',
		false
	);
	const [ rawSettings ] = useSetting< GlobalStylesSettings >( '' );
	const settings = settingsTransform(
		useSettingsForBlockElement( rawSettings )
	);

	return (
		<StylesColorPanel
			inheritedValue={ inheritedStyle }
			value={ style }
			onChange={ setStyle }
			settings={ settings }
			additionalElements={ additionalElements }
			defaultControls={ defaultControls }
			label={ label }
			showInheritanceLabelIndicators={ false }
		/>
	);
}
