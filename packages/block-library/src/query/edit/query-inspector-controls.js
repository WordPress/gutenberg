/**
 * WordPress dependencies
 */
import { PanelBody, QueryControls } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';

export default function QueryInspectorControls( { query, setQuery } ) {
	const { order, orderBy } = query;
	return (
		<InspectorControls>
			<PanelBody title={ __( 'Sorting' ) }>
				<QueryControls
					{ ...{ order, orderBy } }
					onOrderChange={ ( value ) => setQuery( { order: value } ) }
					onOrderByChange={ ( value ) =>
						setQuery( { orderBy: value } )
					}
				/>
			</PanelBody>
		</InspectorControls>
	);
}
