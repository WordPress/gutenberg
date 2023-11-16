/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	Button,
	Tooltip,
} from '@wordpress/components';
import { typography } from '@wordpress/icons';
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

	return (
		<>
			{ !! modalTabOpen && (
				<FontLibraryModal
					onRequestClose={ () => toggleModal() }
					initialTabName={ modalTabOpen }
				/>
			) }

			<VStack spacing={ 3 }>
				<HStack justify="space-between">
					<Subtitle level={ 3 }>{ __( 'Fonts' ) }</Subtitle>
					<HStack justify="flex-end">
						<Tooltip text={ __( 'Manage fonts' ) }>
							<Button
								onClick={ () =>
									toggleModal( 'installed-fonts' )
								}
								aria-label={ __( 'Manage fonts' ) }
								icon={ typography }
								size={ 'small' }
							/>
						</Tooltip>
					</HStack>
				</HStack>
				<ItemGroup isBordered isSeparated>
					{ customFonts.map( ( font ) => (
						<FontFamilyItem key={ font.slug } font={ font } />
					) ) }
					{ themeFonts.map( ( font ) => (
						<FontFamilyItem key={ font.slug } font={ font } />
					) ) }
				</ItemGroup>
			</VStack>
		</>
	);
}

export default ( { ...props } ) => (
	<FontLibraryProvider>
		<FontFamilies { ...props } />
	</FontLibraryProvider>
);
