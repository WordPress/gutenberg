/**
 * External Dependencies
 */
import { plusCircle, cancelCircleFilled } from '@wordpress/icons';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import {
	InspectorControls,
	BlockControls,
	__experimentalBlockAlignmentMatrixControl as BlockAlignmentMatrixControl,
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown,
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
} from '@wordpress/block-editor';
import {
	ToolbarButton,
	ToolbarGroup,
	PanelBody,
	__experimentalNumberControl as NumberControl,
	SelectControl,
	ToggleControl,
	AlignmentMatrixControl
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

export function Toolbar({ openDialog, closeDialog, isOpen, clientId, attributes }) {
	const { dialogPosition } = attributes || {};
	/**
	 * Setup the icon and label for the block toolbar.
	 */
	const { selectBlock, updateBlockAttributes } = useDispatch('core/block-editor');
	const { rootClientId } = useSelect((select) => {
		return {
			rootClientId:
				select('core/block-editor').getBlockRootClientId(clientId),
		};
	}, []);
	const buttonLabel = useMemo(
		() => (isOpen ? __('Close Dialog') : __('Edit Dialog')),
		[isOpen]
	);

	return (
		<BlockControls>
			<ToolbarGroup>
				<ToolbarButton
					label={buttonLabel}
					isActive={isOpen}
					onClick={() => {
						if (isOpen) {
							selectBlock(rootClientId);
							closeDialog();
						} else {
							openDialog();
						}
					}}
				>
					{buttonLabel}
				</ToolbarButton>
				<BlockAlignmentMatrixControl
					label={__('Change dialog position')}
					value={dialogPosition}
					onChange={(nextPosition) => {
						updateBlockAttributes(clientId, { dialogPosition: nextPosition });
					}}
				/>
			</ToolbarGroup>
		</BlockControls>
	);
}

export function InspectorPanel({
	openDialog,
	closeDialog,
	colors,
	clientId,
	context,
	attributes,
	setAttributes,
}) {
	const {
		autoActivationTimer = -1,
		animationDuration = 500,
		animation = 'fade',
		dialogSize = 'medium',
		customBackdropColor,
		enableDeepLink = false,
	} = attributes || {};
	/**
	 * Setup the icon and label for the block toolbar.
	 */
	const { backdropColor, setBackdropColor } = colors;
	const colorSettings = useMultipleOriginColorsAndGradients();

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Dialog Settings', 'prc-block-library')}>
					<SelectControl
						label="Size"
						help="Choose the size of the dialog."
						value={dialogSize}
						options={[
							{
								label: __('Small', 'prc-block-library'),
								value: 'small',
							},
							{
								label: __('Medium', 'prc-block-library'),
								value: 'medium',
							},
							{
								label: __('Large', 'prc-block-library'),
								value: 'large',
							},
						]}
						onChange={(newSize) => {
							setAttributes({
								dialogSize: newSize,
							});
						}}
					/>
					<ToggleControl
						label={__(
							'Enable Deep Linking',
							'prc-block-library'
						)}
						help={__(
							'Allow the dialog to be opened via a URL hash (e.g., #dialog-id).',
							'prc-block-library'
						)}
						checked={enableDeepLink}
						onChange={(newEnableDeepLink) =>
							setAttributes({
								enableDeepLink: newEnableDeepLink,
							})
						}
					/>
					<ToggleControl
						label={__(
							'Auto Activation Timer',
							'prc-block-library'
						)}
						help={__(
							'Automatically open the dialog after the specified time, in milliseconds.',
							'prc-block-library'
						)}
						checked={1 <= autoActivationTimer}
						onChange={(newAutoActivationTimer) =>
							setAttributes({
								autoActivationTimer:
									newAutoActivationTimer ? 5000 : -1,
							})
						}
					/>
					{1 <= autoActivationTimer && (
						<NumberControl
							label="Activation Timer Duration"
							isShiftStepEnabled={true}
							onChange={(newDuration) =>
								setAttributes({
									autoActivationTimer: newDuration,
								})
							}
							shiftStep={100}
							value={autoActivationTimer}
						/>
					)}
				</PanelBody>
				<PanelBody title={__('Animation', 'prc-block-library')}>
					<SelectControl
						label="Dialog Animation"
						help="Choose the animation style for the dialog."
						value={animation}
						options={[
							{
								label: __('Fade', 'prc-block-library'),
								value: 'fade',
							},
							{
								label: __('Pop', 'prc-block-library'),
								value: 'pop',
							},
							{
								label: __('Bounce', 'prc-block-library'),
								value: 'bounce',
							},
							{
								label: __('Slide Down', 'prc-block-library'),
								value: 'slide',
							},
							{
								label: __('Slide Up', 'prc-block-library'),
								value: 'slide-up',
							},
							{
								label: __('Slide Left', 'prc-block-library'),
								value: 'slide-left',
							},
							{
								label: __('Slide Right', 'prc-block-library'),
								value: 'slide-right',
							},
							{
								label: __('Zoom', 'prc-block-library'),
								value: 'zoom',
							},
						]}
						onChange={(newAnimation) => {
							setAttributes({
								animation: newAnimation,
							});
						}}
					/>
					<NumberControl
						label="Animation Duration"
						help="The duration of the dialog animation in milliseconds."
						isShiftStepEnabled={true}
						onChange={(newDuration) =>
							setAttributes({
								animationDuration: newDuration,
							})
						}
						shiftStep={100}
						value={animationDuration}
					/>
				</PanelBody>
			</InspectorControls>
			<InspectorControls group="color">
				<ColorGradientSettingsDropdown
					settings={[
						{
							label: __('Backdrop', 'prc-block-library'),
							colorValue: backdropColor?.color ?? customBackdropColor,
							onColorChange: (value) => {
								setBackdropColor(value);
								setAttributes({
									customBackdropColor: value,
								});
							},
						},
					]}
					panelId={clientId}
					hasColorsOrGradients={false}
					disableCustomColors={false}
					__experimentalIsRenderedInSidebar
					{...colorSettings}
				/>
			</InspectorControls>
		</>
	);
}
