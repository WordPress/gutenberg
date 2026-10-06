import { __, sprintf } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { Icon, Stack } from '@wordpress/ui';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { DEVICE_TYPE_METADATA } from '../../utils/device-type';

/** Reports the width-constrained viewport and responsive editing state in the footer. */
export default function ViewportStatus() {
	const { deviceType, canvasWidth, canvasHeight, isResponsiveEditing } =
		useSelect( ( select ) => {
			const { getDeviceType, getCanvasWidth, getCanvasHeight } = unlock(
				select( editorStore )
			);
			return {
				deviceType: getDeviceType(),
				canvasWidth: getCanvasWidth(),
				canvasHeight: getCanvasHeight(),
				isResponsiveEditing: unlock(
					select( blockEditorStore )
				).isResponsiveEditing(),
			};
		}, [] );

	if ( canvasWidth === undefined ) {
		return null;
	}

	const { label, icon } = DEVICE_TYPE_METADATA[ deviceType ];
	const dimensions =
		typeof canvasHeight === 'number'
			? sprintf(
					// translators: 1: Canvas width in pixels. 2: Canvas height in pixels.
					__( '%1$d × %2$d' ),
					Math.round( canvasWidth ),
					Math.round( canvasHeight )
				)
			: sprintf(
					// translators: %d: Canvas width in pixels. "auto" means the height is unconstrained.
					__( '%d × auto' ),
					Math.round( canvasWidth )
				);

	return (
		<Stack
			direction="row"
			align="center"
			gap="md"
			className="editor-viewport-status"
		>
			{ isResponsiveEditing && (
				<span className="editor-viewport-status__responsive-styles">
					{ __( 'Responsive styles' ) }
				</span>
			) }
			<Stack
				direction="row"
				align="center"
				gap="xs"
				className="editor-viewport-status__device"
			>
				<Icon icon={ icon } size={ 16 } />
				{ sprintf(
					// translators: 1: Viewport type, e.g. "Tablet". 2: Canvas dimensions, e.g. "800 × 400".
					__( '%1$s (%2$s)' ),
					label,
					dimensions
				) }
			</Stack>
		</Stack>
	);
}
