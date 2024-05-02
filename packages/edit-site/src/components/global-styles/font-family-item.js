/**
 * WordPress dependencies
 */
import { _n, sprintf } from '@wordpress/i18n';
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
import { getFamilyPreviewStyle } from './font-library-modal/utils/preview-styles';

function FontFamilyItem( { font } ) {
	const { handleSetLibraryFontSelected, toggleModal } =
		useContext( FontLibraryContext );

	const variantsCount = font?.fontFace?.length || 1;

	const handleClick = () => {
		handleSetLibraryFontSelected( font );
		toggleModal( 'installed-fonts' );
	};

	const previewStyle = getFamilyPreviewStyle( font );

	return (
		<Item onClick={ handleClick }>
			<HStack justify="space-between">
				<FlexItem style={ previewStyle }>{ font.name }</FlexItem>
				<FlexItem className="edit-site-global-styles-screen-typography__font-variants-count">
					{ sprintf(
						/* translators: %d: Number of font variants. */
						_n( '%d variant', '%d variants', variantsCount ),
						variantsCount
					) }
				</FlexItem>
			</HStack>
		</Item>
	);
}

export default FontFamilyItem;
