/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
} from '@wordpress/components';
import { download, check } from '@wordpress/icons';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { FontLibraryContext } from './context';
import FontCard from './font-card';
import { fontFamilyFromGoogleFont } from './utils';

function GoogleFontCard ( { font, onClick } ) {

    const {
        googleFonts,
        addToLibrary,
        updateLibrary,
        installedFontNames,
    } = useContext( FontLibraryContext );

    const handleDonwloadFont = async ( event, name ) => {
		event.stopPropagation();
		const googleFont = googleFonts.find( ( font ) => font.family === name );
        const fontFamily = fontFamilyFromGoogleFont( googleFont );
        const newLibrary = addToLibrary( fontFamily );
        updateLibrary(newLibrary);
	};

    const isInstalled = installedFontNames.has(font.name) || installedFontNames.has(font.fontFamily);

    return (
        <FontCard
            font={ font }
            onClick={ () =>
                onClick( font.name )
            }
            actionHandler={
                !isInstalled
                ? (
                    <Button
                        icon={ download }
                        onClick={ ( event ) =>
                            handleDonwloadFont(
                                event,
                                font.name
                            )
                        }
                        variant="tertiary"
                    />
                ) : (
                    <Button
                        icon={ check }
                    />
                )
            }
        />
    )
}

export default GoogleFontCard;
