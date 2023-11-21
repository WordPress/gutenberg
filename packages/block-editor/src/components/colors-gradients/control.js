/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	BaseControl,
	__experimentalVStack as VStack,
	ColorPalette,
	GradientPicker,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useSettings } from '../use-settings';
import { unlock } from '../../lock-unlock';

const { Tabs } = unlock( componentsPrivateApis );

const colorsAndGradientKeys = [
	'colors',
	'disableCustomColors',
	'gradients',
	'disableCustomGradients',
];

function ColorGradientControlInner( {
	colors,
	gradients,
	disableCustomColors,
	disableCustomGradients,
	__experimentalIsRenderedInSidebar,
	className,
	label,
	onColorChange,
	onGradientChange,
	colorValue,
	gradientValue,
	clearable,
	showTitle = true,
	enableAlpha,
	headingLevel,
} ) {
	const canChooseAColor =
		onColorChange &&
		( ( colors && colors.length > 0 ) || ! disableCustomColors );
	const canChooseAGradient =
		onGradientChange &&
		( ( gradients && gradients.length > 0 ) || ! disableCustomGradients );

	if ( ! canChooseAColor && ! canChooseAGradient ) {
		return null;
	}

	const tabPanels = {
		color: (
			<ColorPalette
				value={ colorValue }
				onChange={
					canChooseAGradient
						? ( newColor ) => {
								onColorChange( newColor );
								onGradientChange();
						  }
						: onColorChange
				}
				{ ...{ colors, disableCustomColors } }
				__experimentalIsRenderedInSidebar={
					__experimentalIsRenderedInSidebar
				}
				clearable={ clearable }
				enableAlpha={ enableAlpha }
				headingLevel={ headingLevel }
			/>
		),
		gradient: (
			<GradientPicker
				__nextHasNoMargin
				value={ gradientValue }
				onChange={
					canChooseAColor
						? ( newGradient ) => {
								onGradientChange( newGradient );
								onColorChange();
						  }
						: onGradientChange
				}
				{ ...{ gradients, disableCustomGradients } }
				__experimentalIsRenderedInSidebar={
					__experimentalIsRenderedInSidebar
				}
				clearable={ clearable }
				headingLevel={ headingLevel }
			/>
		),
	};

	const renderPanelType = ( type ) => (
		<div className="block-editor-color-gradient-control__panel">
			{ tabPanels[ type ] }
		</div>
	);

	return (
		<BaseControl
			__nextHasNoMarginBottom
			className={ classnames(
				'block-editor-color-gradient-control',
				className
			) }
		>
			<fieldset className="block-editor-color-gradient-control__fieldset">
				<VStack spacing={ 1 }>
					{ showTitle && (
						<legend>
							<div className="block-editor-color-gradient-control__color-indicator">
								<BaseControl.VisualLabel>
									{ label }
								</BaseControl.VisualLabel>
							</div>
						</legend>
					) }
					{ canChooseAColor && canChooseAGradient && (
						<div className="block-editor-color-gradient-control__tabs">
							<Tabs
								initialTabId={
									gradientValue
										? 'gradient'
										: !! canChooseAColor && 'color'
								}
							>
								<Tabs.TabList>
									<Tabs.Tab id={ 'color' }>
										{ __( 'Solid' ) }
									</Tabs.Tab>
									<Tabs.Tab id={ 'gradient' }>
										{ __( 'Gradient' ) }
									</Tabs.Tab>
								</Tabs.TabList>
								<Tabs.TabPanel
									id={ 'color' }
									className={
										'block-editor-color-gradient-control__panel'
									}
									focusable={ false }
								>
									{ tabPanels.color }
								</Tabs.TabPanel>
								<Tabs.TabPanel
									id={ 'gradient' }
									className={
										'block-editor-color-gradient-control__panel'
									}
									focusable={ false }
								>
									{ tabPanels.gradient }
								</Tabs.TabPanel>
							</Tabs>
						</div>
					) }

					{ ! canChooseAGradient && renderPanelType( 'color' ) }
					{ ! canChooseAColor && renderPanelType( 'gradient' ) }
				</VStack>
			</fieldset>
		</BaseControl>
	);
}

function ColorGradientControlSelect( props ) {
	const [ colors, gradients, customColors, customGradients ] = useSettings(
		'color.palette',
		'color.gradients',
		'color.custom',
		'color.customGradient'
	);

	return (
		<ColorGradientControlInner
			colors={ colors }
			gradients={ gradients }
			disableCustomColors={ ! customColors }
			disableCustomGradients={ ! customGradients }
			{ ...props }
		/>
	);
}

function ColorGradientControl( props ) {
	if (
		colorsAndGradientKeys.every( ( key ) => props.hasOwnProperty( key ) )
	) {
		return <ColorGradientControlInner { ...props } />;
	}
	return <ColorGradientControlSelect { ...props } />;
}

export default ColorGradientControl;
