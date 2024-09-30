/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
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
	const { baseCustomFonts, modalTabOpen, setModalTabOpen } =
		useContext( FontLibraryContext );
	const [ fontFamilies ] = useGlobalSetting( 'typography.fontFamilies' );
	const [ baseFontFamilies ] = useGlobalSetting(
		'typography.fontFamilies',
		undefined,
		'base'
	);
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

	const hasInstalledFonts =
		hasFonts ||
		baseFontFamilies?.theme?.length > 0 ||
		baseCustomFonts?.length > 0;

	return (
		<>
			{ !! modalTabOpen && (
				<FontLibraryModal
					onRequestClose={ () => setModalTabOpen( null ) }
					defaultTabId={ modalTabOpen }
				/>
			) }

			<VStack spacing={ 4 }>
				{ [ ...themeFonts, ...customFonts ].length > 0 && (
					<>
						<Subtitle level={ 3 }>{ __( 'Fonts' ) }</Subtitle>
						<ItemGroup size="large" isBordered isSeparated>
							{ themeFonts.map( ( font ) => (
								<FontFamilyItem
									key={ font.slug }
									font={ font }
								/>
							) ) }
						</ItemGroup>
					</>
				) }
				{ ! hasFonts && (
					<VStack>
						<Subtitle level={ 3 }>{ __( 'Fonts' ) }</Subtitle>
						<Text as="p">
							{ hasInstalledFonts
								? __( 'No fonts activated.' )
								: __( 'No fonts installed.' ) }
						</Text>
					</VStack>
				) }
				<Button
					className="edit-site-global-styles-font-families__manage-fonts"
					variant="secondary"
					__next40pxDefaultSize
					onClick={ () => {
						setModalTabOpen(
							hasInstalledFonts
								? 'installed-fonts'
								: 'upload-fonts'
						);
					} }
				>
					{ hasInstalledFonts
						? __( 'Manage fonts' )
						: __( 'Add fonts' ) }
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
