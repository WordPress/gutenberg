/**
 * Internal dependencies
 */
import TextFilter from './text-filter';
import { useDataViewsContext } from './context';

export default function GlobalSearchInput( props ) {
	const dataView = useDataViewsContext();
	return <TextFilter { ...props } onChange={ dataView.setGlobalFilter } />;
}
