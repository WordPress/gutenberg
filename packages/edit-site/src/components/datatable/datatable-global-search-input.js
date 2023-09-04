/**
 * Internal dependencies
 */
import DataTableTextFilter from './datatable-text-filter';
import { useDataTableContext } from './context';

// type DataTableTextFilterProps = {
// 	className: string;
// 	searchLabel: string;
// 	onChange: any;
// };

export default function DataTableGlobalSearchInput( props ) {
	const table = useDataTableContext();
	return (
		<DataTableTextFilter { ...props } onChange={ table.setGlobalFilter } />
	);
}
