/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import {
	__experimentalSegmentedControl as SegmentedControl,
	__experimentalSegmentedControlOption as SegmentedControlOption,
} from '@wordpress/components';

export function QueryPaginationArrowControls( { value, onChange } ) {
	return (
		<SegmentedControl
			label={ __(
				'A decorative arrow appended to the next and previous page link.'
			) }
			value={ value }
			onChange={ onChange }
			isBlock
		>
			<SegmentedControlOption
				value="none"
				label={ _x(
					'None',
					'Arrow option for Query Pagination Next/Previous blocks'
				) }
			/>
			<SegmentedControlOption
				value="arrow"
				label={ _x(
					'Arrow',
					'Arrow option for Query Pagination Next/Previous blocks'
				) }
			/>
			<SegmentedControlOption
				value="chevron"
				label={ _x(
					'Chevron',
					'Arrow option for Query Pagination Next/Previous blocks'
				) }
			/>
		</SegmentedControl>
	);
}
