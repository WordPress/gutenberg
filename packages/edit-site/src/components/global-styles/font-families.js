/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalItem as Item,
	FlexItem,
	Button,
} from '@wordpress/components';
import { plus, typography } from '@wordpress/icons';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FontLibraryModal from './font-library-modal';
import FontFamilyItem from './font-family-item';
import Subtitle from './subtitle';
import { unlock } from '../../private-apis';
const { useGlobalSetting } = unlock( blockEditorPrivateApis );

function FontFamilies() {
	const [ fontFamilies ] = useGlobalSetting( 'typography.fontFamilies' );

	const fonts = Array.isArray( fontFamilies?.custom )
		? fontFamilies?.custom
		: fontFamilies?.theme || [];

	const [ tabOpen, setTabOpen ] = useState( null );

	const toggleFontLibrary = ( tabName ) => {
		setTabOpen( !! tabOpen ? null : tabName );
	};

	return (
		<>
			{ !! tabOpen && (
				<FontLibraryModal
					onRequestClose={ toggleFontLibrary }
					initialTabName={ tabOpen }
				/>
			) }

			<VStack spacing={ 3 }>
				<HStack justify="space-between">
					<Subtitle level={ 3 }>{ __( 'Fonts' ) }</Subtitle>
					<HStack justify='flex-end'>
						<Button
							onClick={ () => toggleFontLibrary( "google-fonts" ) }
							aria-label={ __( 'Install fonts' ) }
							icon={ plus }
							isSmall
						/>
						<Button
							onClick={ () => toggleFontLibrary( "installed-fonts" ) }
							aria-label={ __( 'Manage fonts' ) }
							icon={ typography }
							isSmall
						/>
					</HStack>
				</HStack>
				<ItemGroup isBordered isSeparated>
					{ fonts.map( font => (
						<FontFamilyItem
							key={ font.slug }
							font={font}
						/>
					) ) }
				</ItemGroup>
			</VStack>
		</>
	);
}

export default FontFamilies;
