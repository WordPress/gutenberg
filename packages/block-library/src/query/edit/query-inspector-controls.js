/**
 * WordPress dependencies
 */
import { PanelBody, QueryControls } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

export default function QueryInspectorControls( { query, setQuery } ) {
	const { order, orderBy, author: selectedAuthorId } = query;
	const { authorList } = useSelect( ( select ) => {
		const { getEntityRecords } = select( 'core' );
		return {
			authorList: getEntityRecords( 'root', 'user', { per_page: -1 } ),
		};
	}, [] );
	return (
		<InspectorControls>
			<PanelBody title={ __( 'Sorting and filtering' ) }>
				<QueryControls
					{ ...{ order, orderBy, selectedAuthorId, authorList } }
					onOrderChange={ ( value ) => setQuery( { order: value } ) }
					onOrderByChange={ ( value ) =>
						setQuery( { orderBy: value } )
					}
					onAuthorChange={ ( value ) =>
						setQuery( {
							author: value !== '' ? +value : undefined,
						} )
					}
				/>
			</PanelBody>
		</InspectorControls>
	);
}
