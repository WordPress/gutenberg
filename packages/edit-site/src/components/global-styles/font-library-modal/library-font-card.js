/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { CheckboxControl } from '@wordpress/components';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FontCard from './font-card';
import { FontLibraryContext } from './context';

function LibraryFontCard( { font, onClick } ) {
	const { toggleActivateFont, isFontActivated, getFontFacesActivated } =
		useContext( FontLibraryContext );

	const isActive = isFontActivated( font.slug );
	const facesActivated = getFontFacesActivated( font.slug );
	const isPartiallyActivated = !!facesActivated.length && facesActivated.length < font?.fontFace?.length;
	
	const handleToggleFontActivation = () => {
		toggleActivateFont( font );
	};

	const handleClick = () => {
		onClick( font.name );
	};

	const actionHandler = (
		<CheckboxControl
			checked={ isActive }
			onClick={ ( e ) => e.stopPropagation() }
			onChange={ handleToggleFontActivation }
			indeterminate={ isPartiallyActivated }
		/>
	);

	return (
		<FontCard
			onClick={ handleClick }
			font={ font }
			actionHandler={ actionHandler }
		/>
	);
}

export default LibraryFontCard;
