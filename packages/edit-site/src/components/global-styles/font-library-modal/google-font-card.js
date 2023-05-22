/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
    CheckboxControl,
} from '@wordpress/components';
import { download, check } from '@wordpress/icons';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { FontLibraryContext } from './context';
import FontCard from './font-card';

function GoogleFontCard ( { font, onClick, toggleAddFont, isAdded } ) {

    const {
    } = useContext( FontLibraryContext );

    const handleClick = ( event, font ) => {
        event.stopPropagation();
        // toggleInstallFont( fontName );
        toggleAddFont( font );
    };

    return (
        <FontCard
            font={ font }
            onClick={ () =>
                onClick( font.name )
            }
            actionHandler={
                <CheckboxControl
                    onChange={ () => {} }
                    checked={ isAdded }
                    onClick={ ( event ) =>
                        handleClick( event, font )
                    }
                />
            }
        />
    )
}

export default GoogleFontCard;
