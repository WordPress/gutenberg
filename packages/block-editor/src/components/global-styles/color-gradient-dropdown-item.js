/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalHStack as HStack,
	__experimentalZStack as ZStack,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	ColorIndicator,
	Flex,
	FlexItem,
	Dropdown,
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { reset as resetIcon, caution as cautionIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import ColorGradientControl from '../colors-gradients/control';
import { unlock } from '../../lock-unlock';

const { Tabs } = unlock( componentsPrivateApis );

/**
 * @typedef {Object} DropdownContentProps
 * @property {Array}  tabs                         Tab configurations to render.
 * @property {Object} colorGradientControlSettings Settings passed to ColorGradientControl.
 * @property {string} [contrastWarning]            Contrast warning message for the color value.
 */

/**
 * Renders the dropdown content containing the color/gradient picker tabs.
 *
 * @param {DropdownContentProps} props
 */
function DropdownContent( {
	tabs,
	colorGradientControlSettings,
	contrastWarning,
} ) {
	const { key: firstTabKey, ...firstTab } = tabs[ 0 ] ?? {};
	const defaultTabId = tabs.find(
		( tab ) => tab.userValue !== undefined
	)?.key;
	return (
		<DropdownContentWrapper paddingSize="none">
			<div className="block-editor-panel-color-gradient-settings__dropdown-content">
				{ tabs.length === 1 && (
					<ColorGradientTab
						key={ firstTabKey }
						{ ...firstTab }
						colorGradientControlSettings={
							colorGradientControlSettings
						}
						contrastWarning={ contrastWarning }
					/>
				) }
				{ tabs.length > 1 && (
					<Tabs defaultTabId={ defaultTabId }>
						<Tabs.TabList>
							{ tabs.map( ( tab ) => (
								<Tabs.Tab key={ tab.key } tabId={ tab.key }>
									{ tab.label }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>

						{ tabs.map( ( tab ) => {
							const { key: tabKey, ...restTabProps } = tab;
							return (
								<Tabs.TabPanel
									key={ tabKey }
									tabId={ tabKey }
									focusable={ false }
								>
									<ColorGradientTab
										key={ tabKey }
										{ ...restTabProps }
										colorGradientControlSettings={
											colorGradientControlSettings
										}
										contrastWarning={ contrastWarning }
									/>
								</Tabs.TabPanel>
							);
						} ) }
					</Tabs>
				) }
			</div>
		</DropdownContentWrapper>
	);
}

const popoverProps = {
	placement: 'left-start',
	offset: 36,
	shift: true,
};

const LabeledColorIndicators = ( { indicators, label } ) => (
	<HStack justify="flex-start">
		<ZStack isLayered={ false } offset={ -8 }>
			{ indicators.map( ( indicator, index ) => (
				<Flex key={ index } expanded={ false }>
					<ColorIndicator colorValue={ indicator } />
				</Flex>
			) ) }
		</ZStack>
		<FlexItem className="block-editor-panel-color-gradient-settings__color-name">
			{ label }
		</FlexItem>
	</HStack>
);

function ColorGradientTab( {
	isGradient,
	inheritedValue,
	inheritedSlug,
	userValue,
	setValue,
	colorGradientControlSettings,
	contrastWarning,
} ) {
	return (
		<ColorGradientControl
			{ ...colorGradientControlSettings }
			showTitle={ false }
			enableAlpha
			__experimentalIsRenderedInSidebar
			colorValue={ isGradient ? undefined : inheritedValue }
			colorSlug={ isGradient ? undefined : inheritedSlug }
			gradientValue={ isGradient ? inheritedValue : undefined }
			onColorChange={ isGradient ? undefined : setValue }
			onGradientChange={ isGradient ? setValue : undefined }
			clearable={ inheritedValue === userValue }
			headingLevel={ 3 }
			noticeProps={
				! isGradient && contrastWarning
					? {
							children: contrastWarning,
							status: 'warning',
							spokenMessage: null,
							className:
								'block-editor-panel-color-gradient-settings__contrast-notice',
					  }
					: undefined
			}
		/>
	);
}

// Renders a ToolsPanelItem that opens a dropdown containing one or more
// color/gradient pickers. Shared between the Color, Background, and
// Typography panels for consistent color-style controls.
export default function ColorGradientDropdownItem( {
	label,
	hasValue,
	resetValue,
	isShownByDefault,
	indicators,
	tabs,
	colorGradientControlSettings,
	panelId,
	contrastWarning,
	className = 'block-editor-tools-panel-color-gradient-settings__item',
} ) {
	const colorGradientDropdownButtonRef = useRef( undefined );
	return (
		<ToolsPanelItem
			className={ clsx( 'block-editor-color-gradient-item', className ) }
			hasValue={ hasValue }
			label={ label }
			onDeselect={ resetValue }
			isShownByDefault={ isShownByDefault }
			panelId={ panelId }
		>
			<Dropdown
				popoverProps={ popoverProps }
				className="block-editor-tools-panel-color-gradient-settings__dropdown"
				renderToggle={ ( { onToggle, isOpen } ) => {
					const toggleProps = {
						onClick: onToggle,
						className: clsx(
							'block-editor-panel-color-gradient-settings__dropdown',
							{
								'is-open': isOpen,
								'has-contrast-warning': !! contrastWarning,
							}
						),
						'aria-expanded': isOpen,
						ref: colorGradientDropdownButtonRef,
					};

					return (
						<>
							<Button { ...toggleProps } __next40pxDefaultSize>
								<LabeledColorIndicators
									indicators={ indicators }
									label={ label }
								/>
							</Button>
							{ hasValue() && (
								<Button
									__next40pxDefaultSize
									label={ __( 'Reset' ) }
									className="block-editor-panel-color-gradient-settings__reset"
									size="small"
									icon={ resetIcon }
									onClick={ () => {
										resetValue();
										if ( isOpen ) {
											onToggle();
										}
										colorGradientDropdownButtonRef.current?.focus();
									} }
								/>
							) }
							{ contrastWarning && (
								// An icon-only warning that stays visible while a
								// contrast warning is in effect. It is not a menu;
								// activating it opens the color picker popover where
								// the full warning notice is shown, so the indicator
								// doubles as a shortcut to where the issue is fixed.
								<Button
									__next40pxDefaultSize
									size="small"
									icon={ cautionIcon }
									label={ __( 'Low contrast' ) }
									className="block-editor-panel-color-gradient-settings__contrast-warning"
									aria-expanded={ isOpen }
									onClick={ onToggle }
								/>
							) }
						</>
					);
				} }
				renderContent={ () => (
					<DropdownContent
						tabs={ tabs }
						colorGradientControlSettings={
							colorGradientControlSettings
						}
						contrastWarning={ contrastWarning }
					/>
				) }
			/>
		</ToolsPanelItem>
	);
}
