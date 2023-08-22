/**
 * WordPress dependencies
 */
import { _n } from '@wordpress/i18n';
import {
	__experimentalHStack as HStack,
	__experimentalItem as Item,
	FlexItem,
} from '@wordpress/components';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { FontLibraryContext } from './font-library-modal/context';

function FontFamilyItem( { font } ) {
	const { handleSetLibraryFontSelected, toggleModal } =
		useContext( FontLibraryContext );

	const variantsCount = font?.fontFace?.length || 1;

	const handleClick = () => {
		handleSetLibraryFontSelected( font );
		toggleModal( 'installed-fonts' );
	};

	return (
		<Item onClick={ handleClick }>
			<HStack justify="space-between">
				<FlexItem style={ { fontFamily: font.fontFamily } }>
					{ font.name }
				</FlexItem>
				<FlexItem style={ { color: '#9e9e9e' } }>
					{ variantsCount }{ ' ' }
					{ _n( 'variant', 'variants', variantsCount ) }
				</FlexItem>
			</HStack>
		</Item>
	);
}

export default FontFamilyItem;
