/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo, useState, useContext } from '@wordpress/element';
import {
	Spinner,
	__experimentalHeading as Heading,
	__experimentalText as Text,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalSpacer as Spacer,
	CheckboxControl,
	Button,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import TabLayout from './tab-layout';
import FontsGrid from './fonts-grid';
import { DEMO_TEXT } from './constants';
import {
	googleFontToCardFont,
	googleVariantToFullVariant,
} from './utils';
import { FontLibraryContext } from './context';
import GoogleFontCard from './google-font-card';
import GoolgeFontDetails from './google-font-details';

function GoogleFonts() {
	const {
        googleFonts,
        googleFontsCategories,
    } = useContext( FontLibraryContext );
	const [ fontSelected, setFontSelected ] = useState( null );
	const [ filters, setFilters ] = useState( {
		category: googleFontsCategories[ 0 ],
	} );

	const handleSelectFont = ( name ) => {
		const font = googleFonts.find( ( font ) => font.family === name );
		setFontSelected( font );
	};

	const handleUnselectFont = () => {
		setFontSelected( null );
	};

	const fonts = useMemo(
		() =>
			googleFonts.reduce( ( acc, font ) => {
				if ( filters.category === font.category ) {
					acc.push( googleFontToCardFont( font ) );
				}
				return acc;
			}, [] ),
		[ googleFonts, filters ]
	);

	// console.log( 'filtered fonts', fonts, filters );

	const tabDescription = fontSelected
		? __( `Select ${ fontSelected.family } variants you want to install` )
		: __( 'Select a font to install' );

	const handleCategoryFilter = ( category ) => {
		setFilters( { ...filters, category } );
	};

	return (
		<TabLayout
			title={ fontSelected?.family || '' }
			description={ tabDescription }
			handleBack={ !! fontSelected && handleUnselectFont }
		>
			

			{ fonts.length === 0 && (
				<HStack>
					<Spinner />
					<Text>{ __( 'Loading fonts...' ) }</Text>
				</HStack>
			) }

			{ fonts.length > 0 && (
				<>
					{ ! fontSelected && (
                        <>
                            <HStack justify='flex-start'>
                                <Text>{ __( 'Categories:' ) }</Text>
                                { googleFontsCategories.map( ( category ) => (
                                    <Button
                                        isPressed={ filters.category === category }
                                        onClick={ () => handleCategoryFilter( category ) }
                                    >
                                        { category }
                                    </Button>
                                ) ) }
                            </HStack>

                            <Spacer margin={ 8 } />
                            
                            <FontsGrid>
                                { fonts.map( ( font ) => (
                                    <GoogleFontCard
                                        key={ font.family }
                                        font={ font }
                                        handleSelectFont={ handleSelectFont }
                                    />
                                ) ) }
                            </FontsGrid>
                        </>
					) }

					{ fontSelected && (
						<GoolgeFontDetails font={ fontSelected } />
					) }
				</>
			) }
		</TabLayout>
	);
}

export default GoogleFonts;
