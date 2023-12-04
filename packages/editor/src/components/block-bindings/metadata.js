/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { updateBlockBindingsAttribute } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { SearchControl } from '@wordpress/components';

export default function MetadataSourceUI( props ) {
	const {
		attributes,
		setAttributes,
		setIsActiveAttribute,
		currentAttribute,
		context,
	} = props;

	// Fetching the REST API to get the available custom fields.
	// TODO: Review if it works with taxonomies.
	// TODO: Explore how it should work in templates.
	// TODO: Explore if it makes sense to create a custom endpoint for this.
	const data = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );
			return getEntityRecord(
				'postType',
				context.postType,
				context.postId
			);
		},
		[ context.postType, context.postId ]
	);
	const metadata = [];
	function addMetadata( array, newData ) {
		Object.entries( newData ).forEach( ( [ key, value ] ) => {
			// Prettifying the name. But I guess it is not necessary.
			// Plugins could provide it somehow.
			const prettyName = key
				.split( '_' )
				.map(
					( word ) => word.charAt( 0 ).toUpperCase() + word.slice( 1 )
				)
				.join( ' ' );
			array.push( {
				name: prettyName,
				key,
				value,
			} );
			return array;
		} );
	}

	addMetadata( metadata, data.meta );

	// TODO: Decide if these should be added here or as a separate source.
	// Example 1: Extend the list with the ACF fields.
	addMetadata( metadata, data.acf );

	// Example 2: Add post data
	addMetadata( metadata, {
		post_title: data.title.rendered,
		post_date: data.date,
	} );

	// Example 3: Add site data
	const siteData = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );
			return getEntityRecord( 'root', 'site' );
		},
		[ context.postType, context.postId ]
	);
	addMetadata( metadata, {
		site_title: siteData.title,
		site_url: siteData.url,
	} );

	// TODO: Try to abstract this function to be reused across all the sources.
	function selectItem( item ) {
		// Modify the attribute we are binding.
		// TODO: Not sure if we should do this. We might need to process the bindings attribute somehow in the editor to modify the content with context.
		// TODO: Get the type from the block attribute definition and modify/validate the value returned by the source if needed.
		const newAttributes = {};
		newAttributes[ currentAttribute ] = item.value;
		setAttributes( newAttributes );

		// Update the bindings property.
		updateBlockBindingsAttribute(
			attributes,
			setAttributes,
			currentAttribute,
			'metadata',
			{ value: item.key }
		);

		setIsActiveAttribute( false );
	}

	const [ searchInput, setSearchInput ] = useState( '' );

	return (
		<div className="block-bindings-metadata-source-ui">
			{ /* TODO: Implement the Search logic. */ }
			<SearchControl
				label={ __( 'Search metadata' ) }
				value={ searchInput }
				onChange={ setSearchInput }
				size="compact"
			/>
			<ul className="token-metadata-list">
				{ metadata.map( ( item ) => (
					<li
						key={ item.key }
						onClick={ () => selectItem( item ) }
						className={
							attributes.metadata?.bindings?.[ currentAttribute ]
								?.source?.id === 'metadata' &&
							attributes.metadata?.bindings?.[ currentAttribute ]
								?.source?.params?.value === item.key
								? 'selected-meta-field'
								: ''
						}
					>
						{ item.name }
					</li>
				) ) }
			</ul>
		</div>
	);
}
