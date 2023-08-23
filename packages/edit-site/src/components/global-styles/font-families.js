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
import { plus, typography } from '@wordpress/icons';
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
	const { modalTabOepn, toggleModal, themeFonts, customFonts } =
		useContext( FontLibraryContext );

	return (
		<>
			{ !! modalTabOepn && (
				<FontLibraryModal
					onRequestClose={ () => toggleModal() }
					initialTabName={ modalTabOepn }
				/>
			) }

			<VStack spacing={ 3 }>
				<HStack justify="space-between">
					<Subtitle level={ 3 }>{ __( 'Fonts' ) }</Subtitle>
					<HStack justify="flex-end">
						<Tooltip text={ __( 'Add fonts' ) }>
							<Button
								onClick={ () => toggleModal( 'local-fonts' ) }
								aria-label={ __( 'Add fonts' ) }
								icon={ plus }
								isSmall
							/>
						</Tooltip>
						<Tooltip text={ __( 'Manage fonts' ) }>
							<Button
								onClick={ () =>
									toggleModal( 'installed-fonts' )
								}
								aria-label={ __( 'Manage fonts' ) }
								icon={ typography }
								isSmall
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
