/**
 * External dependencies
 */
import { clone } from 'lodash';

/**
 * WordPress dependencies
 */
import { applyFilters, hasFilter } from '@wordpress/hooks';
import { compose } from '@wordpress/compose';
import { Autocomplete as OriginalAutocomplete } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { withBlockEditContext } from '../block-edit/context';

/**
 * Wrap the default Autocomplete component with one that
 * supports a filter hook for customizing its list of autocompleters.
 *
 * This function is exported for unit test.
 *
 * @param  {Function} Autocomplete Original component.
 * @return {Function}              Wrapped component
 */
export function withFilteredAutocompleters( Autocomplete ) {
	return ( props ) => {
		let { completers = [] } = props;

		if ( hasFilter( 'editor.Autocomplete.completers' ) ) {
			completers = applyFilters(
				'editor.Autocomplete.completers',
				// Provide copies so filters may directly modify them.
				completers.map( clone ),
				props.blockName
			);
		}

		return <Autocomplete { ...props } completers={ completers } />;
	};
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/autocomplete/README.md
 */
export default compose( [
	withBlockEditContext( ( { name } ) => ( { blockName: name } ) ),
	withFilteredAutocompleters,
] )( OriginalAutocomplete );
