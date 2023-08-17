/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo, useState, useContext, useEffect } from '@wordpress/element';
import {
	Spinner,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalSpacer as Spacer,
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
import GoolgeFontDetails from './google-font-details';
import PreviewControls from './preview-controls';
import FontCard from './font-card';

const filterFonts = ( fonts, filters ) => {
	const { category, search } = filters;
	let filteredFonts = fonts || [];

	if ( category && category !== 'all' ) {
		filteredFonts = filteredFonts.filter(
			( font ) => font.category === category
		);
	}

	if ( search ) {
		filteredFonts = filteredFonts.filter( ( font ) =>
			font.name.toLowerCase().includes( search.toLowerCase() )
		);
	}

	return filteredFonts;
};

function GoogleFonts() {
	const {
		googleFonts,
		googleFontsCategories,
		installFonts,
		getAvailableFontsOutline,
	} = useContext( FontLibraryContext );
	const [ fontSelected, setFontSelected ] = useState( null );
	const [ filters, setFilters ] = useState( {} );

	const [ newFonts, setNewFonts ] = useState( [] );
	const [ isSaving, setIsSaving ] = useState( false );

	useEffect( () => {
		if ( googleFontsCategories && googleFontsCategories.length > 0 ) {
			setFilters( { category: googleFontsCategories[ 0 ] } );
		}
	}, [ googleFontsCategories ] );

	const newFontsOutline = useMemo(
		() => getAvailableFontsOutline( newFonts ),
		[ newFonts ]
	);
	const isFontAdded = ( font, fontFace ) => {
		if ( ! fontFace ) {
			return !! newFontsOutline[ font.slug ];
		}
		return !! ( newFontsOutline[ font.slug ] || [] ).includes(
			fontFace.fontStyle + fontFace.fontWeight
		);
	};

	const handleSelectFont = ( font ) => {
		setFontSelected( font );
	};

	const handleUnselectFont = () => {
		setFontSelected( null );
	};

	const handleUpdateSearchInput = ( value ) => {
		setFilters( { ...filters, search: value } );
	};
	const debouncedUpdateSearchInput = debounce( handleUpdateSearchInput, 300 );

	const fonts = useMemo(
		() => filterFonts( googleFonts, filters ),
		[ googleFonts, filters ]
	);

	const tabDescription = fontSelected
		? __(
				'Choose font variants. Keep in mind that too many variants could make your site slower.'
		  )
		: __(
				'Add from Google Fonts. Fonts are copied to, and served, from your own server.'
		  );

	const handleCategoryFilter = ( category ) => {
		setFilters( { ...filters, category } );
	};

	const handleSaveChanges = async () => {
		setIsSaving( true );
		await installFonts( newFonts );
		setIsSaving( false );
		setFontSelected( null );
		setNewFonts( [] );
	};

	const toggleAddFont = ( font, fontFace ) => {
		const existingFont = newFonts.find( ( f ) => f.slug === font.slug );
		if ( ! fontFace ) {
			if ( existingFont ) {
				const fontsToAdd = newFonts.filter(
					( f ) => f.slug !== font.slug
				);
				setNewFonts( fontsToAdd );
				return;
			}
			const fontsToAdd = [ ...newFonts, font ];
			setNewFonts( fontsToAdd );
			return;
		}

		if ( existingFont ) {
			const existingFontFace = existingFont.fontFace.find(
				( f ) =>
					f.fontStyle === fontFace.fontStyle &&
					f.fontWeight === fontFace.fontWeight
			);
			if ( existingFontFace ) {
				const fontsToAdd = newFonts
					.map( ( f ) => {
						if ( f.slug === font.slug ) {
							const fontFaceToAdd = f.fontFace.filter(
								( face ) =>
									face.fontStyle !== fontFace.fontStyle ||
									face.fontWeight !== fontFace.fontWeight
							);
							return {
								...f,
								fontFace: fontFaceToAdd,
							};
						}
						return f;
					} )
					.filter( ( f ) => f.fontFace.length > 0 );
				setNewFonts( fontsToAdd );
				return;
			}
			const fontsToAdd = newFonts.map( ( f ) => {
				if ( f.slug === font.slug ) {
					return {
						...f,
						fontFace: [ ...f.fontFace, fontFace ],
					};
				}
				return f;
			} );
			setNewFonts( fontsToAdd );
			return;
		}

		const fontsToAdd = [ ...newFonts, { ...font, fontFace: [ fontFace ] } ];
		setNewFonts( fontsToAdd );
	};

	const capitalize = ( str ) => {
		return str.charAt( 0 ).toUpperCase() + str.slice( 1 );
	};

	const Footer = () => {
		return (
			<HStack justify="flex-end">
				<Button
					variant="primary"
					onClick={ handleSaveChanges }
					disabled={ ! newFonts.length || isSaving }
					isBusy={ isSaving }
				>
					{ __( 'Add & Select' ) }
				</Button>
			</HStack>
		);
	};

	return (
		<TabLayout
			title={ fontSelected?.name || '' }
			description={ tabDescription }
			handleBack={ !! fontSelected && handleUnselectFont }
			footer={ <Footer /> }
		>
			{ fonts === null && (
				<HStack justify="flex-start">
					<Spinner />
					<Text>{ __( 'Loading fonts…' ) }</Text>
				</HStack>
			) }

			{ fonts && fonts.length >= 0 && ! fontSelected && (
				<>
					<HStack justify="flex-start" alignment="flex-start">
						<InputControl
							value={ filters.search }
							placeholder={ __( 'Font name…' ) }
							label={ __( 'Search' ) }
							onChange={ debouncedUpdateSearchInput }
						/>
						<SelectControl
							label={ __( 'Category' ) }
							value={ filters.category }
							onChange={ handleCategoryFilter }
						>
							{ googleFontsCategories &&
								googleFontsCategories.map( ( category ) => (
									<option value={ category }>
										{ capitalize( category ) }
									</option>
								) ) }
						</SelectControl>

						{ /* <PreviewControls /> */ }
					</HStack>

					<Spacer margin={ 8 } />
				</>
			) }

			{ fonts && fonts.length === 0 && (
				<HStack justify="flex-start">
					<Text>
						{ __( 'No fonts found try another search term' ) }
					</Text>
				</HStack>
			) }

			{ fonts && fonts.length > 0 && (
				<>
					{ ! fontSelected && (
						<FontsGrid>
							{ fonts.map( ( font ) => (
								<FontCard
									key={ font.slug }
									font={ font }
									onClick={ () => handleSelectFont( font ) }
								/>
							) ) }
						</FontsGrid>
					) }

					{ fontSelected && (
						<>
							{ /* <PreviewControls /> */ }
							<Spacer margin={ 8 } />
							<GoolgeFontDetails
								font={ fontSelected }
								toggleAddFont={ toggleAddFont }
								isFontAdded={ isFontAdded }
							/>
						</>
					) }
				</>
			) }
		</TabLayout>
	);
}

export default GoogleFonts;
