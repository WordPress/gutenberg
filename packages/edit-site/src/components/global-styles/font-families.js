/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalVStack as VStack,
	Button,
} from '@wordpress/components';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FontLibraryProvider, {
	FontLibraryContext,
} from './font-library-modal/context';
import FontLibraryModal from './font-library-modal';
import FontFamilyItem from './font-family-item';
import Subtitle from './subtitle';

function FontFamilies() {
	const { modalTabOpen, toggleModal, themeFonts, customFonts } =
		useContext( FontLibraryContext );

	const hasFonts = 0 < customFonts.length || 0 < themeFonts.length;

	return (
		<>
			{ !! modalTabOpen && (
				<FontLibraryModal
					onRequestClose={ () => toggleModal() }
					initialTabName={ modalTabOpen }
				/>
			) }

			<VStack spacing={ 3 }>
				<Subtitle level={ 3 }>{ __( 'Fonts' ) }</Subtitle>
				{ hasFonts ? (
					<ItemGroup isBordered isSeparated>
						{ customFonts.map( ( font ) => (
							<FontFamilyItem key={ font.slug } font={ font } />
						) ) }
						{ themeFonts.map( ( font ) => (
							<FontFamilyItem key={ font.slug } font={ font } />
						) ) }
					</ItemGroup>
				) : (
					<>{ __( 'No fonts installed.' ) }</>
				) }
				<Button
					className="edit-site-global-styles-font-families__manage-fonts-button"
					variant="secondary"
					onClick={ () => toggleModal( 'installed-fonts' ) }
					size={ 'compact' }
				>
					{ __( 'Manage all fonts' ) }
				</Button>
			</VStack>
		</>
	);
}

export default ( { ...props } ) => (
	<FontLibraryProvider>
		<FontFamilies { ...props } />
	</FontLibraryProvider>
);
