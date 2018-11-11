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

function isResult( keywords, filterValue ) {
	return keywords.some( ( string ) =>
		normalizeTerm( string ).indexOf( normalizeTerm( filterValue ) ) !== -1
	);
}

export const RichTextInserterItem = withSelect( ( select, { name } ) => ( {
	formatType: select( 'core/rich-text' ).getFormatType( name ),
} ) )( ( props ) => {
	return (
		<Fill name="Inserter.InlineElements">
			{ ( { filterValue } ) => {
				const { keywords = [], title } = props.formatType;

				keywords.push( title, props.title );

				if ( filterValue && ! isResult( keywords, filterValue ) ) {
					return null;
				}

				return <InserterListItem { ...props } icon={ normalizeIconObject( props.icon ) } />;
			} }
		</Fill>
	);
} );
