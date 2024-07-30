/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
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
import { getFontFamilies } from './utils';
import { unlock } from '../../lock-unlock';

const { GlobalStylesContext } = unlock( blockEditorPrivateApis );
const { mergeBaseAndUserConfigs } = unlock( editorPrivateApis );

function Typesets() {
	const { modalTabOpen, setModalTabOpen } = useContext( FontLibraryContext );
	const { base } = useContext( GlobalStylesContext );
	const { user: userConfig } = useContext( GlobalStylesContext );
	const config = mergeBaseAndUserConfigs( base, userConfig );
	const allFontFamilies = getFontFamilies( config );
	const hasFonts =
		allFontFamilies.filter( ( font ) => font !== null ).length > 0;

	return (
		hasFonts && (
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
					</HStack>
					<ItemGroup isBordered isSeparated>
						{ allFontFamilies.map(
							( font ) =>
								font && (
									<FontFamilyItem
										key={ font.slug }
										font={ font }
									/>
								)
						) }
					</ItemGroup>
				</VStack>
			</>
		)
	);
}

export default ( { ...props } ) => (
	<FontLibraryProvider>
		<Typesets { ...props } />
	</FontLibraryProvider>
);
