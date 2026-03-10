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
import type { FontFamily } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { FontLibraryContext } from './font-library/context';
import { getFamilyPreviewStyle } from './font-library/utils/preview-styles';

interface FontFamilyItemProps {
	font: FontFamily;
}

function FontFamilyItem( { font }: FontFamilyItemProps ) {
	const { handleSetLibraryFontSelected, setModalTabOpen } =
		useContext( FontLibraryContext );

	const variantsCount = font?.fontFace?.length || 1;

	const handleClick = () => {
		handleSetLibraryFontSelected?.( font );
		setModalTabOpen?.( 'installed-fonts' );
	};

	const previewStyle = getFamilyPreviewStyle( font );

	return (
		<Item onClick={ handleClick }>
			<HStack justify="space-between">
				<FlexItem style={ previewStyle }>{ font.name }</FlexItem>
				<FlexItem className="global-styles-ui-screen-typography__font-variants-count">
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
