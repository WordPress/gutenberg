/**
 * WordPress dependencies
 */
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';

export default function CommentsQueryOrderControls( { value, onChange } ) {
	return (
		<ToggleGroupControl
			label={ __( 'Show first' ) }
			value={ value }
			onChange={ onChange }
			help={ __(
				'Choose between showing first the newer or the older comments at the top of each page.'
			) }
			isBlock
		>
			<ToggleGroupControlOption
				value="desc"
				label={ _x(
					'Newer Comments',
					'Newer comments at the top of each page'
				) }
			/>
			<ToggleGroupControlOption
				value="asc"
				label={ _x(
					'Older Comments',
					'Older comments at the top of each page'
				) }
			/>
		</ToggleGroupControl>
	);
}
