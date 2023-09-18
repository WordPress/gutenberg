/**
 * WordPress dependencies
 */
import { useContext, useEffect } from '@wordpress/element';
import { Spinner } from '@wordpress/components';

/**
 * Internal dependencies
 */
import TabLayout from './tab-layout';
import { FontLibraryContext } from './context';

function FontCollection( { id } ) {
	const { collections, getFontCollection } = useContext( FontLibraryContext );
	const selectedCollection = collections.find(
		( collection ) => collection.id === id
	);

	useEffect( () => {
		getFontCollection( id );
	}, [ id, getFontCollection ] );

	return (
		<TabLayout
			title={ selectedCollection.name }
			description={ selectedCollection.description }
		>
			{ ! selectedCollection.data && <Spinner /> }

			{ Array.isArray( selectedCollection?.data?.fontFamilies ) &&
				selectedCollection.data.fontFamilies.map( ( font ) => (
					<div key={ font.family }>{ font.name }</div>
				) ) }
		</TabLayout>
	);
}

export default FontCollection;
