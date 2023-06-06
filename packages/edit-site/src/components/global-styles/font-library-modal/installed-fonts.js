/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useContext, useState } from '@wordpress/element';
import {
	__experimentalHStack as HStack,
	__experimentalSpacer as Spacer,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import TabLayout from './tab-layout';
import { FontLibraryContext } from './context';
import FontsGrid from './fonts-grid';
import LibraryFontDetails from './library-font-details';
import SaveButton from '../../save-button';
import PreviewControls from './preview-controls';
import LibraryFontCard from './library-font-card';

function InstalledFonts() {
	const { themeFonts, libraryFonts, libraryFontSelected, setLibraryFontSelected } = useContext( FontLibraryContext );

	const handleUnselectFont = () => {
		setLibraryFontSelected( null );
	};

	const handleSelectFont = ( font ) => {
		setLibraryFontSelected( font );
	};

	const tabDescription = !! libraryFontSelected
		? __( `${ libraryFontSelected.name } variants.` )
		: __(
				'Fonts installed in your WordPress, activate them to use in your site.'
		  );

	return (
		<TabLayout
			title={ libraryFontSelected?.name || '' }
			description={ tabDescription }
			handleBack={ !! libraryFontSelected && handleUnselectFont }
			footer={ <Footer /> }
		>
			{ ! libraryFontSelected && (
				<>
					{/* <PreviewControls /> */}

					{ libraryFonts.length > 0 && (
						<>
							<Spacer margin={ 4 } />
							<FontsGrid>
								{ libraryFonts.map( ( font ) => (
									<LibraryFontCard
										font={ font }
										key={ font.slug }
										onClick={ () => {
											handleSelectFont( font );
										} }
									/>
								) ) }
							</FontsGrid>
						</>
					)}
					
					{ themeFonts.length > 0 && (
						<>
							<Spacer margin={ 10 } />
							<FontsGrid
								title={ __( 'Theme Fonts' ) }
							>
								{ themeFonts.map( ( font ) => (
									<LibraryFontCard
										font={ font }
										key={ font.slug }
										onClick={ () => {
											handleSelectFont( font );
										} }
									/>
								) ) }
							</FontsGrid>
						</>
					)}

				</>
			) }

			{ libraryFontSelected && (
				<LibraryFontDetails
					font={ libraryFontSelected }
					handleUnselectFont={ handleUnselectFont }
					canBeRemoved={ libraryFontSelected?.source !== 'theme' }
				/>
			) }
		</TabLayout>
	);
}

function Footer() {
	return (
		<HStack justify="flex-end">
			<SaveButton
				textForDefaultState={ __( "Update" ) }
				textForIsDirtyState={ __( "Update" ) }
				textForDisabledState={ __( "Update" ) }
			/>
		</HStack>
	);
}

export default InstalledFonts;
