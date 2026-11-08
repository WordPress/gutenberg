import clsx from 'clsx';
import {
	__experimentalSpacer as Spacer,
	__experimentalToolsPanel as ToolsPanel,
} from '@wordpress/components';
import { useRegistry } from '@wordpress/data';
import { useInstanceId } from '@wordpress/compose';
import ColorGradientSettingsDropdown from './dropdown';
import useColorsAndGradientsPalettes from './use-multiple-origin-colors-and-gradients';
import type { PanelColorGradientSettingsProps } from './types';

const colorsAndGradientKeys = [
	'colors',
	'disableCustomColors',
	'gradients',
	'disableCustomGradients',
];

export const PanelColorGradientSettingsInner = ( {
	className,
	colors,
	gradients,
	disableCustomColors,
	disableCustomGradients,
	children,
	settings,
	title,
	showTitle = true,
	__experimentalIsRenderedInSidebar,
	enableAlpha,
}: PanelColorGradientSettingsProps ) => {
	// `ToolsPanel` only compares the id, so the numeric instance ID works.
	const panelId = useInstanceId(
		PanelColorGradientSettingsInner
	) as unknown as string;
	const { batch } = useRegistry();
	if (
		( ! colors || colors.length === 0 ) &&
		( ! gradients || gradients.length === 0 ) &&
		disableCustomColors &&
		disableCustomGradients &&
		settings?.every(
			( setting ) =>
				( ! setting.colors || setting.colors.length === 0 ) &&
				( ! setting.gradients || setting.gradients.length === 0 ) &&
				( setting.disableCustomColors === undefined ||
					setting.disableCustomColors ) &&
				( setting.disableCustomGradients === undefined ||
					setting.disableCustomGradients )
		)
	) {
		return null;
	}

	return (
		<ToolsPanel
			className={ clsx(
				'block-editor-panel-color-gradient-settings',
				className
			) }
			hasInnerWrapper
			// `ToolsPanel` hides its header without a label.
			label={ ( showTitle ? title : undefined ) as string }
			resetAll={ () => {
				batch( () => {
					settings.forEach(
						( {
							colorValue,
							gradientValue,
							onColorChange,
							onGradientChange,
						} ) => {
							// A set value implies its change handler.
							if ( colorValue ) {
								onColorChange!();
							} else if ( gradientValue ) {
								onGradientChange!();
							}
						}
					);
				} );
			} }
			panelId={ panelId }
			__experimentalFirstVisibleItemClass="first"
			__experimentalLastVisibleItemClass="last"
		>
			<div className="block-editor-panel-color-gradient-settings__inner-wrapper">
				<ColorGradientSettingsDropdown
					settings={ settings }
					panelId={ panelId }
					{ ...{
						colors,
						gradients,
						disableCustomColors,
						disableCustomGradients,
						__experimentalIsRenderedInSidebar,
						enableAlpha,
					} }
				/>
				{ !! children && (
					<>
						<Spacer marginTop={ 4 } marginBottom={ 0 } />
						{ children }
					</>
				) }
			</div>
		</ToolsPanel>
	);
};

const PanelColorGradientSettingsSelect = (
	props: PanelColorGradientSettingsProps
) => {
	const colorGradientSettings = useColorsAndGradientsPalettes();
	return (
		<PanelColorGradientSettingsInner
			{ ...{ ...colorGradientSettings, ...props } }
		/>
	);
};

const PanelColorGradientSettings = (
	props: PanelColorGradientSettingsProps
) => {
	if (
		colorsAndGradientKeys.every( ( key ) => props.hasOwnProperty( key ) )
	) {
		return <PanelColorGradientSettingsInner { ...props } />;
	}
	return <PanelColorGradientSettingsSelect { ...props } />;
};

export default PanelColorGradientSettings;
