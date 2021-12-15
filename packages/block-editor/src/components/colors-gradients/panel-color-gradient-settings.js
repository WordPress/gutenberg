/**
 * External dependencies
 */
import classnames from 'classnames';
import { every, isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalHStack as HStack,
	__experimentalSpacer as Spacer,
	FlexItem,
	ColorIndicator,
	PanelBody,
	Dropdown,
} from '@wordpress/components';
import { sprintf, __, isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ColorGradientControl from './control';
import { getColorObjectByColorValue } from '../colors';
import { __experimentalGetGradientObjectByGradientValue } from '../gradients';
import useSetting from '../use-setting';
import useCommonSingleMultipleSelects from './use-common-single-multiple-selects';
import useMultipleOriginColorsAndGradients from './use-multiple-origin-colors-and-gradients';

// translators: first %s: The type of color or gradient (e.g. background, overlay...), second %s: the color name or value (e.g. red or #ff0000)
const colorIndicatorAriaLabel = __( '(%s: color %s)' );

// translators: first %s: The type of color or gradient (e.g. background, overlay...), second %s: the color name or value (e.g. red or #ff0000)
const gradientIndicatorAriaLabel = __( '(%s: gradient %s)' );

const colorsAndGradientKeys = [
	'colors',
	'disableCustomColors',
	'gradients',
	'disableCustomGradients',
];

const Indicators = ( { colors, gradients, settings } ) => {
	return settings.map(
		(
			{
				colorValue,
				gradientValue,
				label,
				colors: availableColors,
				gradients: availableGradients,
			},
			index
		) => {
			if ( ! colorValue && ! gradientValue ) {
				return null;
			}
			let ariaLabel;
			if ( colorValue ) {
				const colorObject = getColorObjectByColorValue(
					availableColors || colors,
					colorValue
				);
				ariaLabel = sprintf(
					colorIndicatorAriaLabel,
					label.toLowerCase(),
					( colorObject && colorObject.name ) || colorValue
				);
			} else {
				const gradientObject = __experimentalGetGradientObjectByGradientValue(
					availableGradients || gradients,
					colorValue
				);
				ariaLabel = sprintf(
					gradientIndicatorAriaLabel,
					label.toLowerCase(),
					( gradientObject && gradientObject.name ) || gradientValue
				);
			}

			return (
				<ColorIndicator
					key={ index }
					colorValue={ colorValue || gradientValue }
					aria-label={ ariaLabel }
				/>
			);
		}
	);
};

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
	__experimentalHasMultipleOrigins,
	__experimentalIsRenderedInSidebar,
	enableAlpha,
	...props
} ) => {
	if (
		isEmpty( colors ) &&
		isEmpty( gradients ) &&
		disableCustomColors &&
		disableCustomGradients &&
		every(
			settings,
			( setting ) =>
				isEmpty( setting.colors ) &&
				isEmpty( setting.gradients ) &&
				( setting.disableCustomColors === undefined ||
					setting.disableCustomColors ) &&
				( setting.disableCustomGradients === undefined ||
					setting.disableCustomGradients )
		)
	) {
		return null;
	}

	const titleElement = (
		<span className="block-editor-panel-color-gradient-settings__panel-title">
			{ title }
			<Indicators
				colors={ colors }
				gradients={ gradients }
				settings={ settings }
			/>
		</span>
	);

	let dropdownPosition;
	let popoverProps;
	if ( __experimentalIsRenderedInSidebar ) {
		dropdownPosition = isRTL() ? 'bottom right' : 'bottom left';
		popoverProps = { __unstableForcePosition: true };
	}

	return (
		<PanelBody
			className={ classnames(
				'block-editor-panel-color-gradient-settings',
				className
			) }
			title={ showTitle ? titleElement : undefined }
			{ ...props }
		>
			<ItemGroup
				isBordered
				isSeparated
				className="block-editor-panel-color-gradient-settings__item-group"
			>
				{ settings.map( ( setting, index ) => (
					<Dropdown
						position={ dropdownPosition }
						popoverProps={ popoverProps }
						className="block-editor-panel-color-gradient-settings__dropdown"
						key={ index }
						contentClassName="block-editor-panel-color-gradient-settings__dropdown-content"
						renderToggle={ ( { isOpen, onToggle } ) => {
							return (
								<Item
									onClick={ onToggle }
									className={ classnames(
										'block-editor-panel-color-gradient-settings__item',
										{ 'is-open': isOpen }
									) }
								>
									<HStack justify="flex-start">
										<ColorIndicator
											className="block-editor-panel-color-gradient-settings__color-indicator"
											colorValue={
												setting.gradientValue ??
												setting.colorValue
											}
										/>
										<FlexItem>{ setting.label }</FlexItem>
									</HStack>
								</Item>
							);
						} }
						renderContent={ () => (
							<ColorGradientControl
								showTitle={ false }
								{ ...{
									colors,
									gradients,
									disableCustomColors,
									disableCustomGradients,
									__experimentalHasMultipleOrigins,
									__experimentalIsRenderedInSidebar,
									enableAlpha,
									...setting,
								} }
							/>
						) }
					/>
				) ) }
			</ItemGroup>
			{ !! children && (
				<>
					<Spacer marginY={ 4 } /> { children }
				</>
			) }
		</PanelBody>
	);
};

const PanelColorGradientSettingsSingleSelect = ( props ) => {
	const colorGradientSettings = useCommonSingleMultipleSelects();
	colorGradientSettings.colors = useSetting( 'color.palette' );
	colorGradientSettings.gradients = useSetting( 'color.gradients' );
	return (
		<PanelColorGradientSettingsInner
			{ ...{ ...colorGradientSettings, ...props } }
		/>
	);
};

const PanelColorGradientSettingsMultipleSelect = ( props ) => {
	const colorGradientSettings = useMultipleOriginColorsAndGradients();
	return (
		<PanelColorGradientSettingsInner
			{ ...{ ...colorGradientSettings, ...props } }
		/>
	);
};

const PanelColorGradientSettings = ( props ) => {
	if (
		every( colorsAndGradientKeys, ( key ) => props.hasOwnProperty( key ) )
	) {
		return <PanelColorGradientSettingsInner { ...props } />;
	}
	if ( props.__experimentalHasMultipleOrigins ) {
		return <PanelColorGradientSettingsMultipleSelect { ...props } />;
	}
	return <PanelColorGradientSettingsSingleSelect { ...props } />;
};

export default PanelColorGradientSettings;
