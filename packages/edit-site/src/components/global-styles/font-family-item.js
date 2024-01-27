/**
 * WordPress dependencies
 */
import { _n, sprintf } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import {
	__experimentalHStack as HStack,
	__experimentalItem as Item,
	FlexItem,
} from '@wordpress/components';
import { useContext } from '@wordpress/element';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { FontLibraryContext } from './font-library-provider';
import { getFamilyPreviewStyle } from './font-library-modal/utils/preview-styles';
import { FONT_LIBRARY_MODAL_NAME } from './font-library-modal';

function FontFamilyItem( { font } ) {
	const { handleSetLibraryFontSelected } = useContext( FontLibraryContext );
	const { openModal } = useDispatch( interfaceStore );

	const variantsCount = font?.fontFace?.length || 1;

	const handleClick = () => {
		handleSetLibraryFontSelected( font );
		openModal( FONT_LIBRARY_MODAL_NAME );
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
