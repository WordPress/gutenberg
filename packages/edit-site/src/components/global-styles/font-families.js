/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import {
	__experimentalText as Text,
	__experimentalItemGroup as ItemGroup,
	__experimentalVStack as VStack,
	Button,
} from '@wordpress/components';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
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
import { setUIValuesNeeded } from './font-library-modal/utils';
import { unlock } from '../../lock-unlock';

const { useGlobalSetting } = unlock( blockEditorPrivateApis );

function FontFamilies() {
	const { modalTabOpen, setModalTabOpen } = useContext( FontLibraryContext );
	const [ fontFamilies ] = useGlobalSetting( 'typography.fontFamilies' );
	const themeFonts = fontFamilies?.theme
		? fontFamilies.theme
				.map( ( f ) => setUIValuesNeeded( f, { source: 'theme' } ) )
				.sort( ( a, b ) => a.name.localeCompare( b.name ) )
		: [];
	const customFonts = fontFamilies?.custom
		? fontFamilies.custom
				.map( ( f ) => setUIValuesNeeded( f, { source: 'custom' } ) )
				.sort( ( a, b ) => a.name.localeCompare( b.name ) )
		: [];
	const hasFonts = 0 < customFonts.length || 0 < themeFonts.length;

	return (
		<>
			{ !! modalTabOpen && (
				<FontLibraryModal
					onRequestClose={ () => setModalTabOpen( null ) }
					defaultTabId={ modalTabOpen }
				/>
			) }

			<VStack spacing={ 4 }>
				{ themeFonts.length > 0 && (
					<VStack>
						<Subtitle level={ 3 }>
							{
								/* translators: Heading for a list of fonts provided by the theme. */
								_x( 'Theme', 'font source' )
							}
						</Subtitle>
						<ItemGroup isBordered isSeparated>
							{ themeFonts.map( ( font ) => (
								<FontFamilyItem
									key={ font.slug }
									font={ font }
								/>
							) ) }
						</ItemGroup>
					</VStack>
				) }
				{ customFonts.length > 0 && (
					<VStack>
						<Subtitle level={ 3 }>
							{
								/* translators: Heading for a list of fonts installed by the user. */
								_x( 'Custom', 'font source' )
							}
						</Subtitle>
						<ItemGroup isBordered isSeparated>
							{ customFonts.map( ( font ) => (
								<FontFamilyItem
									key={ font.slug }
									font={ font }
								/>
							) ) }
						</ItemGroup>
					</VStack>
				) }
				{ ! hasFonts && (
					<VStack>
						<Subtitle level={ 3 }>{ __( 'Fonts' ) }</Subtitle>
						<Text as="p">{ __( 'No fonts installed.' ) }</Text>
					</VStack>
				) }
				<Button
					className="edit-site-global-styles-font-families__manage-fonts"
					variant="secondary"
					__next40pxDefaultSize
					onClick={ () =>
						setModalTabOpen(
							hasFonts ? 'installed-fonts' : 'upload-fonts'
						)
					}
				>
					{ hasFonts ? __( 'Manage fonts' ) : __( 'Add fonts' ) }
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
