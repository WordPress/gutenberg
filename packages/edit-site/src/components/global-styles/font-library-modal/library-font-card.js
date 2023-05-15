/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { CheckboxControl } from '@wordpress/components';
import { useContext, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FontCard from './font-card';
import { FontLibraryContext } from './context';


function LibraryFontCard ({ font, onClick }) {
    const { customFonts, toggleActivateFont } = useContext( FontLibraryContext );
    const isActive = !!customFonts.find( family => family.name === font.name );

    const handleToggleFontActivation = () => {
        console.log("handleActivateFont");
        toggleActivateFont( font.name );
    }

    return (
        <FontCard
            onClick={ () => { onClick( font.name ) } }
            font={ font }
            actionHandler={
                <CheckboxControl
                    checked={ isActive }
                    onClick={ (e) => e.stopPropagation() }
                    onChange={ handleToggleFontActivation }
                />
            }
        />
    );
}

export default LibraryFontCard;
