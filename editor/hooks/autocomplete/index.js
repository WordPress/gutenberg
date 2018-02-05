/**
 * External dependencies
 */
import { compose } from 'lodash';
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Autocomplete, withContext } from '@wordpress/components';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { blockAutocompleter, userAutocompleter } from './autocompleters';
import { getInserterItems } from '../../store/selectors';

function withAutocomplete( BlockEdit ) {
	function WrappedBlockEdit( props ) {
		const { name, items, onReplace } = props;

		// Only wrap paragraph blocks with <Autocomplete>
		if ( name !== 'core/paragraph' ) {
			return <BlockEdit { ...props } />;
		}

		return (
			<Autocomplete completers={ [ blockAutocompleter( { items, onReplace } ), userAutocompleter() ] }>
				{ ( { isExpanded, listBoxId, activeId } ) => (
					// TODO: These aria attributes probably belong on the <Editable>... not sure how to make that happen
					// eslint-disable-next-line jsx-a11y/aria-activedescendant-has-tabindex
					<div
						aria-autocomplete="list"
						aria-expanded={ isExpanded }
						aria-owns={ listBoxId }
						aria-activedescendant={ activeId }
					>
						{ <BlockEdit { ...props } /> }
					</div>
				) }
			</Autocomplete>
		);
	}

	return compose(
		withContext( 'editor' )( settings => ( {
			enabledBlockTypes: settings.blockTypes,
		} ) ),
		connect( ( state, ownProps ) => ( {
			items: getInserterItems( state, ownProps.enabledBlockTypes ),
		} ) )
	)( WrappedBlockEdit );
}

addFilter( 'blocks.BlockEdit', 'core/autocomplete/edit', withAutocomplete );
