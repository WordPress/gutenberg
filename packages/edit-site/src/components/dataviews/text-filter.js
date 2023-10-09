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

export default function TextFilter( {
	className,
	searchLabel = __( 'Filter list' ),
	onChange,
} ) {
	const [ search, setSearch, debouncedSearch ] = useDebouncedInput();
	useEffect( () => {
		onChange( debouncedSearch );
	}, [ debouncedSearch, onChange ] );
	return (
		<SearchControl
			className={ classnames( 'dataviews__text-filter', className ) }
			onChange={ setSearch }
			value={ search }
			label={ searchLabel }
			placeholder={ searchLabel }
			size="compact"
		/>
	);
}
