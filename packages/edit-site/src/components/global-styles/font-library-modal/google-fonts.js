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
import { download, check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import TabLayout from './tab-layout';
import FontsGrid from './fonts-grid';
import FontCard from './font-card';
import { DEMO_TEXT } from './constants';
import {
	getGoogleFontDefinitions,
	googleFontToCardFont,
	googleVariantToFullVariant,
} from './utils';
import { FontLibraryContext } from './context';

function GoogleFonts() {
	const {
        googleFonts,
        googleFontsCategories,
        installGoogleFonts,
        installedFontNames,
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

	const handleDonwloadFont = async ( event, name ) => {
		event.stopPropagation();
		const googleFont = googleFonts.find( ( font ) => font.family === name );
		const data = {
			fontFamilies: getGoogleFontDefinitions( googleFont ),
		};
		const response = await installGoogleFonts( data );
		console.log( response );
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

	console.log( 'filtered fonts', fonts, filters );

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
                                    <FontCard
                                        font={ font }
                                        key={ font.name }
                                        onClick={ () =>
                                            handleSelectFont( font.name )
                                        }
                                        actionHandler={
                                            !installedFontNames.has(font.name) && !installedFontNames.has(font.fontFamily)
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
                                ) ) }
                            </FontsGrid>
                        </>
					) }

					{ fontSelected && (
						<>
							<Spacer margin={ 8 } />
							<VStack spacing={ 4 }>
								{ fontSelected.variants.map( ( variant ) => (
									<HStack spacing={ 2 } justify="flex-start">
										<CheckboxControl />
										<VStack spacing={ 2 }>
											<Heading level={ 5 }>
												{ googleVariantToFullVariant(
													variant
												) }
											</Heading>
											<Text>{ DEMO_TEXT }</Text>
										</VStack>
									</HStack>
								) ) }
							</VStack>
						</>
					) }
				</>
			) }
		</TabLayout>
	);
}

export default GoogleFonts;
