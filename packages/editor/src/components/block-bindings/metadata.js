/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SearchControl } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';

export default function MetadataSourceUI( props ) {
	const { setAttributes, setIsActiveAttribute } = props;
	// Fetching the REST API to get the available custom fields.
	//
	// Ensure we have the full context.
	// Check if it is a page, a post, a CPT, a taxonomy...
	// Ensure that context is available in all the blocks. It is not in the images.
	// TODO: This is not working yet. Hardcoded to a post.
	// TODO: Only run the fetch once. Right now it is triggered each time I click the button.
	const [ metadata, setMetadata ] = useState( [] );
	useEffect( () => {
		apiFetch( {
			path: '/wp/v2/posts/1',
		} ).then( ( posts ) => {
			// TODO: Add filter in case plugins want to add/remove/modify fields.
			// metadataaa = posts.meta;
			let fetchedMetadata = [];
			Object.entries( posts.meta ).forEach( ( [ key, value ] ) => {
				// Prettifying the name. But I guess it is not necessary.
				// Plugins could provide it somehow.
				const prettyName = key
					.split( '_' )
					.map(
						( word ) =>
							word.charAt( 0 ).toUpperCase() + word.slice( 1 )
					)
					.join( ' ' );
				fetchedMetadata = [
					...fetchedMetadata,
					{
						name: prettyName,
						key,
						value,
					},
				];
			} );
			setMetadata( fetchedMetadata );
		} );
	}, [] );

	const [ selectedField, setSelectedField ] = useState( null );
	// TODO: Try to abstract this function to be reused across all the sources.
	function selectItem( item, props ) {
		const { currentAttribute } = props;
		setSelectedField( item );

		const newAttributes = {};
		// Modify the attribute we are binding.
		newAttributes[ currentAttribute ] = item.value;

		// If the attribute exists in the bindings, update it.
		// Otherwise, add it.
		const newBindings = props.attributes.bindings
			? props.attributes.bindings
			: [];
		let attributeExists = false;
		newBindings.forEach( ( binding ) => {
			if ( binding.attribute === currentAttribute ) {
				binding.source.name = 'metadata';
				binding.source.params.value = item.key;
				attributeExists = true;
			}
		} );
		if ( ! attributeExists ) {
			newBindings.push( {
				attribute: currentAttribute,
				source: {
					name: 'metadata',
					params: { value: item.key },
				},
			} );
		}
		newAttributes.bindings = newBindings;
		setAttributes( newAttributes );

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
						onClick={ () => selectItem( item, props ) }
						className={
							selectedField?.key === item.key
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
