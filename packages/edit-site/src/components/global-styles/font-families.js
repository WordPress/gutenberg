/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	Button,
} from '@wordpress/components';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { settings } from '@wordpress/icons';
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

			<VStack spacing={ 2 }>
				<HStack justify="space-between">
					<Subtitle level={ 3 }>{ __( 'Fonts' ) }</Subtitle>
					<Button
						onClick={ () => setModalTabOpen( 'installed-fonts' ) }
						label={ __( 'Manage fonts' ) }
						icon={ settings }
						size="small"
					/>
				</HStack>
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
					<>
						{ __( 'No fonts installed.' ) }
						<Button
							className="edit-site-global-styles-font-families__add-fonts"
							variant="secondary"
							onClick={ () => setModalTabOpen( 'upload-fonts' ) }
						>
							{ __( 'Add fonts' ) }
						</Button>
					</>
				) }
			</VStack>
		</>
	);
}

export default ( { ...props } ) => (
	<FontLibraryProvider>
		<FontFamilies { ...props } />
	</FontLibraryProvider>
);
