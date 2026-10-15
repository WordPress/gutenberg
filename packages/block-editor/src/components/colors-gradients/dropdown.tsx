import clsx from 'clsx';
import type { ComponentProps, ReactNode } from 'react';
import {
	Button,
	ColorIndicator,
	Dropdown,
	FlexItem,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	__experimentalHStack as HStack,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { reset as resetIcon } from '@wordpress/icons';
import ColorGradientControl from './control';
import type {
	ColorGradientSetting,
	ColorGradientSettingsDropdownProps,
} from './types';

// When the `ColorGradientSettingsDropdown` controls are being rendered to a
// `ToolsPanel` they must be wrapped in a `ToolsPanelItem`.
const WithToolsPanelItem = ( {
	setting,
	children,
	panelId,
	...props
}: Partial< ComponentProps< typeof ToolsPanelItem > > & {
	setting: ColorGradientSetting;
	children: ReactNode;
} ) => {
	// A set value implies its change handler.
	const clearValue = () => {
		if ( setting.colorValue ) {
			setting.onColorChange!();
		} else if ( setting.gradientValue ) {
			setting.onGradientChange!();
		}
	};
	return (
		<ToolsPanelItem
			hasValue={ () => {
				return !! setting.colorValue || !! setting.gradientValue;
			} }
			// Every setting rendered in a `ToolsPanel` has a label.
			label={ setting.label! }
			onDeselect={ clearValue }
			isShownByDefault={
				setting.isShownByDefault !== undefined
					? setting.isShownByDefault
					: true
			}
			{ ...props }
			className={ clsx(
				'block-editor-color-gradient-item',
				'block-editor-tools-panel-color-gradient-settings__item'
			) }
			panelId={ panelId }
			// Pass resetAllFilter if supplied due to rendering via SlotFill
			// into parent ToolsPanel.
			resetAllFilter={ setting.resetAllFilter }
		>
			{ children }
		</ToolsPanelItem>
	);
};

const LabeledColorIndicator = ( {
	colorValue,
	label,
}: {
	colorValue?: string | null;
	label?: string;
} ) => (
	<HStack justify="flex-start">
		<ColorIndicator
			className="block-editor-panel-color-gradient-settings__color-indicator"
			// A `null` style value sets no background, like `undefined`.
			colorValue={ colorValue as string | undefined }
		/>
		<FlexItem
			className="block-editor-panel-color-gradient-settings__color-name"
			title={ label }
		>
			{ label }
		</FlexItem>
	</HStack>
);

// Renders a color dropdown's toggle as an `Item` if it is within an `ItemGroup`
// or as a `Button` if it isn't e.g. the controls are being rendered in
// a `ToolsPanel`.
const renderToggle = (
	settings: Pick<
		ColorGradientSetting,
		| 'clearable'
		| 'colorValue'
		| 'gradientValue'
		| 'onColorChange'
		| 'onGradientChange'
		| 'label'
	>
) =>
	function Toggle( {
		onToggle,
		isOpen,
	}: {
		onToggle: () => void;
		isOpen: boolean;
	} ) {
		const {
			clearable,
			colorValue,
			gradientValue,
			onColorChange,
			onGradientChange,
			label,
		} = settings;
		const colorButtonRef = useRef< HTMLButtonElement >( undefined );

		const toggleProps = {
			onClick: onToggle,
			className: clsx(
				'block-editor-panel-color-gradient-settings__dropdown',
				{ 'is-open': isOpen }
			),
			'aria-expanded': isOpen,
			ref: colorButtonRef,
		};

		// A set value implies its change handler.
		const clearValue = () => {
			if ( colorValue ) {
				onColorChange!();
			} else if ( gradientValue ) {
				onGradientChange!();
			}
		};

		const value = colorValue ?? gradientValue;

		return (
			<>
				<Button __next40pxDefaultSize { ...toggleProps }>
					<LabeledColorIndicator
						colorValue={ value }
						label={ label }
					/>
				</Button>
				{ clearable && value && (
					<Button
						__next40pxDefaultSize
						label={ __( 'Reset' ) }
						className="block-editor-panel-color-gradient-settings__reset"
						size="small"
						icon={ resetIcon }
						onClick={ () => {
							clearValue();
							if ( isOpen ) {
								onToggle();
							}
							// Return focus to parent button
							colorButtonRef.current?.focus();
						} }
					/>
				) }
			</>
		);
	};

// Renders a collection of color controls as dropdowns. Depending upon the
// context in which these dropdowns are being rendered, they may be wrapped
// in an `ItemGroup` with each dropdown's toggle as an `Item`, or alternatively,
// the may be individually wrapped in a `ToolsPanelItem` with the toggle as
// a regular `Button`.
//
// For more context see: https://github.com/WordPress/gutenberg/pull/40084
export default function ColorGradientSettingsDropdown( {
	colors,
	disableCustomColors,
	disableCustomGradients,
	enableAlpha,
	gradients,
	settings,
	__experimentalIsRenderedInSidebar,
	...props
}: ColorGradientSettingsDropdownProps ) {
	let popoverProps: ComponentProps< typeof Dropdown >[ 'popoverProps' ];
	if ( __experimentalIsRenderedInSidebar ) {
		popoverProps = {
			placement: 'left-start',
			offset: 36,
			shift: true,
		};
	}

	return (
		<>
			{ settings.map( ( setting, index ) => {
				const controlProps = {
					clearable: false,
					colorValue: setting.colorValue,
					colors,
					disableCustomColors,
					disableCustomGradients,
					enableAlpha,
					gradientValue: setting.gradientValue,
					gradients,
					label: setting.label,
					onColorChange: setting.onColorChange,
					onGradientChange: setting.onGradientChange,
					showTitle: false,
					__experimentalIsRenderedInSidebar,
					...setting,
				};
				const toggleSettings = {
					clearable: setting.clearable,
					label: setting.label,
					colorValue: setting.colorValue,
					gradientValue: setting.gradientValue,
					onColorChange: setting.onColorChange,
					onGradientChange: setting.onGradientChange,
				};

				return (
					setting && (
						// If not in an `ItemGroup` wrap the dropdown in a
						// `ToolsPanelItem`
						<WithToolsPanelItem
							key={ index }
							setting={ setting }
							{ ...props }
						>
							<Dropdown
								popoverProps={ popoverProps }
								className="block-editor-tools-panel-color-gradient-settings__dropdown"
								renderToggle={ renderToggle( toggleSettings ) }
								renderContent={ () => (
									<DropdownContentWrapper paddingSize="none">
										<div className="block-editor-panel-color-gradient-settings__dropdown-content">
											<ColorGradientControl
												{ ...controlProps }
											/>
										</div>
									</DropdownContentWrapper>
								) }
							/>
						</WithToolsPanelItem>
					)
				);
			} ) }
		</>
	);
}
