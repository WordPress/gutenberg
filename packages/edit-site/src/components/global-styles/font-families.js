/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	Button,
	Tooltip,
} from '@wordpress/components';
import { typography } from '@wordpress/icons';
import { useContext } from '@wordpress/element';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { FontLibraryContext } from './font-library-provider';
import FontFamilyItem from './font-family-item';
import Subtitle from './subtitle';
import { FONT_LIBRARY_MODAL_NAME } from './font-library-modal';

export default function FontFamilies() {
	const { themeFonts, customFonts } = useContext( FontLibraryContext );
	const { openModal } = useDispatch( interfaceStore );
	const hasFonts = 0 < customFonts.length || 0 < themeFonts.length;

	return (
		<VStack spacing={ 3 }>
			<HStack justify="space-between">
				<Subtitle level={ 3 }>{ __( 'Fonts' ) }</Subtitle>
				<HStack justify="flex-end">
					<Tooltip text={ __( 'Manage fonts' ) }>
						<Button
							onClick={ () =>
								openModal( FONT_LIBRARY_MODAL_NAME )
							}
							aria-label={ __( 'Manage fonts' ) }
							icon={ typography }
							size={ 'small' }
						/>
					</Tooltip>
				</HStack>
			</HStack>
			{ hasFonts ? (
				<ItemGroup isBordered isSeparated>
					{ [ ...customFonts, ...themeFonts ].map( ( font ) => (
						<FontFamilyItem key={ font.slug } font={ font } />
					) ) }
				</ItemGroup>
			) : (
				<>{ __( 'No fonts installed.' ) }</>
			) }
		</VStack>
	);
}
