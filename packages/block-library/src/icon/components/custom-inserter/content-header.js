/**
 * WordPress dependencies
 */
import { SearchControl } from '@wordpress/components';

export default function ContentHeader( props ) {
	const { searchInput, setSearchInput } = props;

	return (
		<div className="wp-block-icon__inserter-header">
			<SearchControl value={ searchInput } onChange={ setSearchInput } />
		</div>
	);
}
