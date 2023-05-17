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
        toggleActivateFont( font.name );
    }

    const handleClick = font.shouldBeRemoved
        ? null
        : () => { onClick( font.name ) };

    const actionHandler = (
        font.shouldBeRemoved
        ? null
        : (
            <CheckboxControl
                checked={ isActive }
                onClick={ (e) => e.stopPropagation() }
                onChange={ handleToggleFontActivation }
            />
        )
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
