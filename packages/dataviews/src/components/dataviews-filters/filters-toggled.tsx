import { useContext } from '@wordpress/element';
import DataViewsContext from '../dataviews-context';
import Filters from './filters';

function FiltersToggled( props: { className?: string } ) {
	const { isShowingFilter } = useContext( DataViewsContext );
	if ( ! isShowingFilter ) {
		return null;
	}
	return <Filters { ...props } />;
}

export default FiltersToggled;
