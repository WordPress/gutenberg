/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useContext } from '@wordpress/element';
import { Icon } from '@wordpress/components';
import { chevronRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import FontCard from './font-card';
import { FontLibraryContext } from './context';

function LibraryFontCard( { font, ...props } ) {
	const { getFontFacesActivated } = useContext( FontLibraryContext );

	const variantsInstalled = font.fontFace?.length || 1;
	const variantsActive = getFontFacesActivated( font.slug, font.source ).length;
	const variantsText = __(
		`${ variantsActive }/${ variantsInstalled } variants active`
	);

	return (
		<FontCard
			font={ font }
			variantsText={ variantsText }
			actionHandler={ <Icon icon={ chevronRight } /> }
			{ ...props }
		/>
	);
}

export default LibraryFontCard;
