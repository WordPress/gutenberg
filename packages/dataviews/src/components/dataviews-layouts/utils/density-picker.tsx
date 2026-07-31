/**
 * WordPress dependencies
 */
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import i18n from '@wordpress/dataviews-i18n';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataViewsContext from '../../dataviews-context';
import type {
	ViewTable,
	ViewList,
	ViewGrid,
	ViewPickerGrid,
	Density,
} from '../../../types';

export default function DensityPicker() {
	const context = useContext( DataViewsContext );
	const view = context.view as
		| ViewTable
		| ViewList
		| ViewGrid
		| ViewPickerGrid;
	return (
		<ToggleGroupControl
			label={ i18n.DENSITY() }
			value={ view.layout?.density || 'balanced' }
			onChange={ ( value ) => {
				context.onChangeView( {
					...view,
					layout: {
						...view.layout,
						density: value as Density,
					},
				} );
			} }
			isBlock
		>
			<ToggleGroupControlOption
				key="comfortable"
				value="comfortable"
				label={ i18n.COMFORTABLE() }
			/>
			<ToggleGroupControlOption
				key="balanced"
				value="balanced"
				label={ i18n.BALANCED() }
			/>
			<ToggleGroupControlOption
				key="compact"
				value="compact"
				label={ i18n.COMPACT() }
			/>
		</ToggleGroupControl>
	);
}
