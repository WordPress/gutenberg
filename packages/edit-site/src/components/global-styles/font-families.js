/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalText as Text,
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

/**
 * Maps the fonts with the source, if available.
 *
 * @param {Array}  fonts  The fonts to map.
 * @param {string} source The source of the fonts.
 * @return {Array} The mapped fonts.
 */
function mapFontsWithSource( fonts, source ) {
	return fonts
		? fonts.map( ( f ) => setUIValuesNeeded( f, { source } ) )
		: [];
}

function FontFamilies() {
	const { baseCustomFonts, modalTabOpen, setModalTabOpen } =
		useContext( FontLibraryContext );
	const [ fontFamilies ] = useGlobalSetting( 'typography.fontFamilies' );
	const [ baseFontFamilies ] = useGlobalSetting(
		'typography.fontFamilies',
		undefined,
		'base'
	);
	const themeFonts = mapFontsWithSource( fontFamilies?.theme, 'theme' );
	const customFonts = mapFontsWithSource( fontFamilies?.custom, 'custom' );
	const activeFonts = [ ...themeFonts, ...customFonts ].sort( ( a, b ) =>
		a.name.localeCompare( b.name )
	);
	const hasFonts = 0 < activeFonts.length;
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
				{ activeFonts.length > 0 && (
					<>
						<ItemGroup size="large" isBordered isSeparated>
							{ activeFonts.map( ( font ) => (
								<FontFamilyItem
									key={ font.slug }
									font={ font }
								/>
							) ) }
						</ItemGroup>
					</>
				) }
				{ ! hasFonts && (
					<>
						<Text as="p">
							{ hasInstalledFonts
								? __( 'No fonts activated.' )
								: __( 'No fonts installed.' ) }
						</Text>
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
