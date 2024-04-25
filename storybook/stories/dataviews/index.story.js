/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import defaultData from './data';
import defaultFields from './fields';
import defaultView from './view';

const meta = {
	title: 'Playground/DataViews',
	component: DataViews,
	argTypes: {
		search: { control: 'boolean', default: true },
		searchLabel: { control: 'text' },
		isLoading: { control: 'boolean' },
	},
	parameters: {
		controls: { expanded: true },
		sourceLink: 'storybook/stories/dataviews',
	},
};
export default meta;

const Template = ( { onChange, data, view: _view, fields, ...args } ) => {
	const [ view, setView ] = useState( _view );
	const { data: filteredData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ data, view, fields ] );

	return (
		<DataViews
			{ ...args }
			data={ filteredData }
			fields={ fields }
			view={ view }
			onChangeView={ setView }
			paginationInfo={ paginationInfo }
		/>
	);
};

export const Default = Template.bind( {} );
Default.args = {
	data: defaultData,
	fields: defaultFields,
	view: defaultView,
};
