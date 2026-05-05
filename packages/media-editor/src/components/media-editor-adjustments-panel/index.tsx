/**
 * WordPress dependencies
 */
import { Button, RangeControl } from '@wordpress/components';
import { Stack, VisuallyHidden } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	DEFAULT_IMAGE_EDITING_ADJUSTMENTS,
	type ImageEditingAdjustments,
	type ImageEditingSession,
} from '../image-editing-session';
import { CROP_CONTROL_ATTR } from '../../hooks/use-crop-gesture-handlers';

type AdjustmentKey = keyof ImageEditingAdjustments;

interface AdjustmentControlConfig {
	key: AdjustmentKey;
	label: string;
	min: number;
	max: number;
	step: number;
	format: ( value: number ) => string;
}

const ADJUSTMENT_CONTROLS: AdjustmentControlConfig[] = [
	{
		key: 'brightness',
		label: __( 'Brightness' ),
		min: 0,
		max: 2,
		step: 0.01,
		format: ( value ) => `${ Math.round( value * 100 ) }%`,
	},
	{
		key: 'contrast',
		label: __( 'Contrast' ),
		min: 0,
		max: 2,
		step: 0.01,
		format: ( value ) => `${ Math.round( value * 100 ) }%`,
	},
	{
		key: 'saturation',
		label: __( 'Saturation' ),
		min: 0,
		max: 2,
		step: 0.01,
		format: ( value ) => `${ Math.round( value * 100 ) }%`,
	},
	{
		key: 'grayscale',
		label: __( 'Greyscale' ),
		min: 0,
		max: 1,
		step: 0.01,
		format: ( value ) => `${ Math.round( value * 100 ) }%`,
	},
];

function isDefaultAdjustment(
	key: AdjustmentKey,
	value: ImageEditingAdjustments[ AdjustmentKey ]
) {
	return value === DEFAULT_IMAGE_EDITING_ADJUSTMENTS[ key ];
}

export interface MediaEditorAdjustmentsPanelProps {
	/** Current image editing session. */
	session: ImageEditingSession;
}

/**
 * Sidebar panel for native image adjustment controls.
 *
 * Adjustments are registered through the image editor extension panel surface
 * so the panel API is exercised by a real internal consumer before it is made
 * available to third-party extensions.
 *
 * @param props
 * @param props.session Current image editing session.
 */
export default function MediaEditorAdjustmentsPanel( {
	session,
}: MediaEditorAdjustmentsPanelProps ) {
	return (
		<Stack direction="column" gap="md">
			<VisuallyHidden render={ <h2 /> }>
				{ __( 'Adjust options' ) }
			</VisuallyHidden>
			{ ADJUSTMENT_CONTROLS.map( ( control ) => {
				const value = session.adjustments[ control.key ];
				return (
					<div
						key={ control.key }
						role="presentation"
						{ ...{
							[ CROP_CONTROL_ATTR ]: true,
							onPointerUp: session.commitHistory,
							onPointerCancel: session.commitHistory,
							onBlur: session.commitHistory,
						} }
					>
						<RangeControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ control.label }
							min={ control.min }
							max={ control.max }
							step={ control.step }
							value={ value }
							onChange={ ( nextValue ) =>
								session.setAdjustment(
									control.key,
									typeof nextValue === 'number'
										? nextValue
										: DEFAULT_IMAGE_EDITING_ADJUSTMENTS[
												control.key
										  ]
								)
							}
							renderTooltipContent={ ( nextValue ) => {
								const tooltipValue =
									typeof nextValue === 'number'
										? nextValue
										: value;
								return control.format( tooltipValue );
							} }
						/>
					</div>
				);
			} ) }
			<Button
				size="compact"
				variant="tertiary"
				disabled={ ADJUSTMENT_CONTROLS.every( ( control ) =>
					isDefaultAdjustment(
						control.key,
						session.adjustments[ control.key ]
					)
				) }
				accessibleWhenDisabled
				onClick={ session.resetAdjustments }
			>
				{ __( 'Reset adjustments' ) }
			</Button>
		</Stack>
	);
}
