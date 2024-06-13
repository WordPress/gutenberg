/**
 * WordPress dependencies
 */
import { isRTL, __ } from '@wordpress/i18n';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	FlexItem,
} from '@wordpress/components';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { useContext } from '@wordpress/element';
import { Icon, chevronLeft, chevronRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import FontLibraryProvider from './font-library-modal/context';
import { getFontFamilies } from './utils';
import { NavigationButtonAsItem } from './navigation-button';
import Subtitle from './subtitle';
import { unlock } from '../../lock-unlock';

const { GlobalStylesContext } = unlock( blockEditorPrivateApis );
const { mergeBaseAndUserConfigs } = unlock( editorPrivateApis );

function TypesetButton() {
	const { base } = useContext( GlobalStylesContext );
	const { user: userConfig } = useContext( GlobalStylesContext );
	const config = mergeBaseAndUserConfigs( base, userConfig );
	const allFontFamilies = getFontFamilies( config );
	const hasFonts =
		allFontFamilies.filter( ( font ) => font !== null ).length > 0;

	return (
		hasFonts && (
			<VStack spacing={ 2 }>
				<HStack justify="space-between">
					<Subtitle level={ 3 }>{ __( 'Typeset' ) }</Subtitle>
				</HStack>
				<ItemGroup isBordered isSeparated>
					<NavigationButtonAsItem
						path="/typography/typeset"
						aria-label={ __( 'Typeset' ) }
					>
						<HStack direction="row">
							<FlexItem>
								{ allFontFamilies
									.map( ( font ) => font.name )
									.join( ', ' ) }
							</FlexItem>
							<Icon
								icon={ isRTL() ? chevronLeft : chevronRight }
							/>
						</HStack>
					</NavigationButtonAsItem>
				</ItemGroup>
			</VStack>
		)
	);
}

export default ( { ...props } ) => (
	<FontLibraryProvider>
		<TypesetButton { ...props } />
	</FontLibraryProvider>
);
