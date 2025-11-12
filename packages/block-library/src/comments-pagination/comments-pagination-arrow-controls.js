/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';

export function CommentsPaginationArrowControls( { value, onChange } ) {
	return (
		<ToggleGroupControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ __( 'Arrow' ) }
			value={ value }
			onChange={ onChange }
			help={ __(
				'A decorative arrow appended to the next and previous comments link.'
			) }
			isBlock
		>
			<ToggleGroupControlOption
				value="none"
				label={ _x(
					'None',
					'Arrow option for Comments Pagination Next/Previous blocks'
				) }
			/>
			<ToggleGroupControlOption
				value="arrow"
				label={ _x(
					'Arrow',
					'Arrow option for Comments Pagination Next/Previous blocks'
				) }
			/>
			<ToggleGroupControlOption
				value="chevron"
				label={ _x(
					'Chevron',
					'Arrow option for Comments Pagination Next/Previous blocks'
				) }
			/>
		</ToggleGroupControl>
	);
}
