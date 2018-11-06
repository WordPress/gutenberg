/**
 * WordPress dependencies
 */
import { normalizeIconObject } from '@wordpress/blocks';
import { Fill } from '@wordpress/components';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import InserterListItem from '../inserter-list-item';
import { normalizeTerm } from '../inserter/menu';

function isResult( { title, keywords = [] }, filterValue ) {
	const normalizedSearchTerm = normalizeTerm( filterValue );
	const matchSearch = ( string ) => normalizeTerm( string ).indexOf( normalizedSearchTerm ) !== -1;
	return matchSearch( title ) || keywords.some( matchSearch );
}

export const RichTextInserterListItem = withSelect( ( select, { name } ) => ( {
	formatType: select( 'core/rich-text' ).getFormatType( name ),
} ) )( ( props ) => {
	return (
		<Fill name="Inserter.InlineElements">
			{ ( { filterValue } ) => {
				if ( filterValue && ! isResult( props.formatType, filterValue ) ) {
					return null;
				}

				return <InserterListItem { ...props } icon={ normalizeIconObject( props.icon ) } />;
			} }
		</Fill>
	);
} );
