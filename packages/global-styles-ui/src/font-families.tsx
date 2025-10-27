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
import { settings } from '@wordpress/icons';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Subtitle } from './subtitle';
import { useSetting } from './hooks';
import FontLibraryProvider, {
	FontLibraryContext,
} from './font-library-modal/context';
import FontLibraryModal from './font-library-modal';
import FontFamilyItem from './font-family-item';
import { setUIValuesNeeded } from './font-library-modal/utils';

/**
 * Maps the fonts with the source, if available.
 *
 * @param {Array}  fonts  The fonts to map.
 * @param {string} source The source of the fonts.
 * @return {Array} The mapped fonts.
 */
function mapFontsWithSource( fonts: any[], source: string ) {
	return fonts
		? fonts.map( ( f ) => setUIValuesNeeded( f, { source } ) )
		: [];
}

function FontFamiliesInner() {
	const { baseCustomFonts, modalTabOpen, setModalTabOpen } =
		useContext( FontLibraryContext );
	const [ fontFamilies ] = useSetting( 'typography.fontFamilies' );
	const [ baseFontFamilies ] = useSetting(
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
		( baseCustomFonts?.length ?? 0 ) > 0;

	return (
		<>
			{ !! modalTabOpen && (
				<FontLibraryModal
					onRequestClose={ () => setModalTabOpen?.( '' ) }
					defaultTabId={ modalTabOpen }
				/>
			) }

			<VStack spacing={ 2 }>
				<HStack justify="space-between">
					<Subtitle level={ 3 }>{ __( 'Fonts' ) }</Subtitle>
					<Button
						onClick={ () => setModalTabOpen?.( 'installed-fonts' ) }
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
							className="global-styles-ui-font-families__manage-fonts"
							variant="secondary"
							__next40pxDefaultSize
							onClick={ () => {
								setModalTabOpen?.(
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

export default function FontFamilies( { ...props } ) {
	return (
		<FontLibraryProvider>
			<FontFamiliesInner { ...props } />
		</FontLibraryProvider>
	);
}
