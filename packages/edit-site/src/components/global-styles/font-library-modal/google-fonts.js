/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo, useState, useContext, useEffect } from '@wordpress/element';
import {
	Spinner,
	__experimentalHeading as Heading,
	__experimentalText as Text,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalSpacer as Spacer,
	CheckboxControl,
	__experimentalInputControl as InputControl,
	Button,
	SelectControl,
} from '@wordpress/components';
import { debounce } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import TabLayout from './tab-layout';
import FontsGrid from './fonts-grid';
import { FontLibraryContext } from './context';
import GoogleFontCard from './google-font-card';
import GoolgeFontDetails from './google-font-details';
import PreviewControls from './preview-controls';


const filterFonts = ( fonts, filters ) => {
	const { category, search } = filters;
	let filteredFonts = fonts || [];

	if ( category && category !== 'all' ) {
		filteredFonts = filteredFonts.filter( ( font ) =>
			font.category === category
		);
	}

	if ( search ) {
		filteredFonts = filteredFonts.filter( ( font ) =>
			font.name.toLowerCase().includes( search.toLowerCase() )
		);
	}
	
	return filteredFonts.slice(0,96);
}

function GoogleFonts() {
	const {
		libraryFonts,
        googleFonts,
        googleFontsCategories,
		updateLibrary,
    } = useContext( FontLibraryContext );
	const [ fontSelected, setFontSelected ] = useState( null );
	const [ filters, setFilters ] = useState( {} );
	

	const [ initialLibraryFonts, setInitialLibraryFonts ] = useState( [] );
	const [ hasChanges,setHasChanges ] = useState( false );
	const [ isSaving, setIsSaving ] = useState( false );

	useEffect( () => {
		if( initialLibraryFonts.length === 0 && libraryFonts.length > 0 ){
			setInitialLibraryFonts( libraryFonts );
		}
		
		if (
			initialLibraryFonts.length !== 0 &&
			libraryFonts !== initialLibraryFonts
		) {
			setHasChanges( true );
		}
	}, [ libraryFonts ] );

	useEffect( () => {
		if ( googleFontsCategories && googleFontsCategories.length > 0 ) {
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

	const handleUpdateSearchInput = ( value ) => {
		setFilters( { ...filters, search: value } );
	};
	const debouncedUpdateSearchInput = debounce( handleUpdateSearchInput, 300 );

	const fonts = useMemo( () => filterFonts( googleFonts, filters ), 
		[googleFonts, filters]
	);

	const tabDescription = fontSelected
		? __( `Select ${ fontSelected.name } variants you want to install` )
		: __( 'Select a font to install' );

	const handleCategoryFilter = ( category ) => {
		setFilters( { ...filters, category } );
	};

	const handleSaveChanges = async () => {
		setIsSaving( true );
		await updateLibrary();
		setIsSaving( false );
	};

	const Footer = () => {
		return (
			<HStack justify="flex-end">
				<Button variant="primary" onClick={ handleSaveChanges } disabled={ !hasChanges || isSaving }>
					{ isSaving && <Spinner/> } { __("Install Google Fonts") }
				</Button>
			</HStack>
		);
	}

	return (
		<TabLayout
			title={ fontSelected?.name || '' }
			description={ tabDescription }
			handleBack={ !! fontSelected && handleUnselectFont }
			footer={ <Footer /> }
		>
			{ fonts === null && (
				<HStack justify='flex-start'>
					<Spinner />
					<Text>{ __( 'Loading fonts...' ) }</Text>
				</HStack>
			) }

			{ ( fonts && fonts.length >= 0 && !fontSelected ) && (
				<>
					<HStack justify='flex-start' alignment='flex-start'>
						<InputControl
							value={ filters.search }
							placeholder={ __('Font name...') }
							label={ __( 'Search' ) }
							onChange={ debouncedUpdateSearchInput }
						/>
						<SelectControl
							label={ __( 'Category' ) }
							value={ filters.category }
							onChange={ handleCategoryFilter }
						>
							{ googleFontsCategories && googleFontsCategories.map( ( category ) => (
								<option value={category}>
									{ category }
								</option>
							) ) }
						</SelectControl>

						<PreviewControls />

					</HStack>

					<Spacer margin={ 8 } />
				</>
			)}

			{ fonts && fonts.length === 0 && (
				<HStack justify='flex-start'>
					<Text>{ __( 'No fonts found try another search term' ) }</Text>
				</HStack>
			)}

			{ fonts && fonts.length > 0 && (
				<>
					{ ! fontSelected && (
						<FontsGrid>
							{ fonts.map( ( font ) => (
								<GoogleFontCard
									key={ font.name }
									font={ font }
									onClick={ handleSelectFont }
								/>
							) ) }
						</FontsGrid>
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
