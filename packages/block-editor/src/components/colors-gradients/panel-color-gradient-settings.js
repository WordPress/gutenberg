/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	__experimentalSpacer as Spacer,
	__experimentalToolsPanel as ToolsPanel,
} from '@wordpress/components';
import { useRegistry } from '@wordpress/data';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import ColorGradientSettingsDropdown from './dropdown';
import useColorsAndGradientsPalettes from './use-multiple-origin-colors-and-gradients';

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
} ) => {
	const panelId = useInstanceId( PanelColorGradientSettingsInner );
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
			label={ showTitle ? title : undefined }
			resetAll={ () => {
				batch( () => {
					settings.forEach(
						( {
							colorValue,
							gradientValue,
							onColorChange,
							onGradientChange,
						} ) => {
							if ( colorValue ) {
								onColorChange();
							} else if ( gradientValue ) {
								onGradientChange();
							}
						}
					);
				} );
			} }
			panelId={ panelId }
			__experimentalFirstVisibleItemClass="first"
			__experimentalLastVisibleItemClass="last"
		>
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
					<Spacer marginY={ 4 } /> { children }
				</>
			) }
		</ToolsPanel>
	);
};

const PanelColorGradientSettingsSelect = ( props ) => {
	const colorGradientSettings = useColorsAndGradientsPalettes();
	return (
		<PanelColorGradientSettingsInner
			{ ...{ ...colorGradientSettings, ...props } }
		/>
	);
};

const PanelColorGradientSettings = ( props ) => {
	if (
		colorsAndGradientKeys.every( ( key ) => props.hasOwnProperty( key ) )
	) {
		return <PanelColorGradientSettingsInner { ...props } />;
	}
	return <PanelColorGradientSettingsSelect { ...props } />;
};

export default PanelColorGradientSettings;
