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

function GoogleFontCard ( { font, onClick } ) {

    const {
        isFontInstalled,
        demoConfig,
        toggleInstallFont,
    } = useContext( FontLibraryContext );

    const isInstalled = isFontInstalled( font.name );

    const handleClick = ( event, fontName ) => {
        event.stopPropagation();
        toggleInstallFont( fontName );
    };


    const alternativeButtton = !isInstalled
    ? (
        <Button
            icon={ download }
            onClick={ ( event ) =>
                handleClick( event, font.name )
            }
            variant="tertiary"
        />
    ) : (
        <Button
            icon={ check }
            onClick={ ( event ) =>
                handleClick( event, font.name )
            }
        />
    )

    return (
        <FontCard
            font={ font }
            onClick={ () =>
                onClick( font.name )
            }
            actionHandler={
                <CheckboxControl
                    onChange={ () => {} }
                    checked={ isInstalled }
                    onClick={ ( event ) =>
                        handleClick( event, font.name )
                    }
                />
            }
        />
    )
}

export default GoogleFontCard;
