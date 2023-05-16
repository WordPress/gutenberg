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
import { FontLibraryContext } from './context';
import GoogleFontCard from './google-font-card';
import GoolgeFontDetails from './google-font-details';
import { useEffect } from 'react';

function GoogleFonts() {
	const {
        googleFonts,
        googleFontsCategories,
    } = useContext( FontLibraryContext );
	const [ fontSelected, setFontSelected ] = useState( null );
	const [ filters, setFilters ] = useState( {} );

	useEffect( () => {
		if ( googleFontsCategories.length > 0 ) {
			setFilters( { category: googleFontsCategories[ 0 ] } );
		}
	}, [ googleFontsCategories ] );

	const handleSelectFont = ( name ) => {
		const font = googleFonts.find( font => font.name === name );
		setFontSelected( font );
	};

	const handleUnselectFont = () => {
		setFontSelected( null );
	};

	const fonts = googleFonts.reduce( ( acc, font ) => {
				if ( filters.category === font.category ) {
					return [...acc, font];
				}
				return acc;
			}, [] );

	const tabDescription = fontSelected
		? __( `Select ${ fontSelected.name } variants you want to install` )
		: __( 'Select a font to install' );

	const handleCategoryFilter = ( category ) => {
		setFilters( { ...filters, category } );
	};

	return (
		<TabLayout
			title={ fontSelected?.name || '' }
			description={ tabDescription }
			handleBack={ !! fontSelected && handleUnselectFont }
		>
			

			{ fonts.length === 0 && (
				<HStack justify='flex-start'>
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
                                        key={ font.name }
                                        font={ font }
                                        onClick={ handleSelectFont }
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
