/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import { SearchControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import useDebouncedInput from '../../utils/use-debounced-input';

// export type DataTableTextFilterProps = {
// 	className: string;
// 	searchLabel: string;
// 	onChange: any;
// };

export default function DataTableTextFilter( {
	className,
	searchLabel = __( 'Search' ),
	onChange,
} ) {
	const [ search, setSearch, debouncedSearch ] = useDebouncedInput();
	const baseCssClass = 'some-class-name';
	useEffect( () => {
		onChange( debouncedSearch );
	}, [ debouncedSearch, onChange ] );
	return (
		<SearchControl
			className={ classnames( `${ baseCssClass }-search`, className ) }
			onChange={ setSearch }
			value={ search }
			label={ searchLabel }
			placeholder={ searchLabel }
		/>
	);
}
