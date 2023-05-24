/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalItem as Item,
	__experimentalText as Text,
	FlexItem,
	Button,
	MenuGroup,
	MenuItem,
	Dropdown,
} from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FontLibraryModal from './font-library-modal';
import Subtitle from './subtitle';
import { unlock } from '../../private-apis';
const { useGlobalSetting } = unlock( blockEditorPrivateApis );

function FontFamiliesMenu ({ onToggle, toggleFontLibrary }) {

    const displayFontLibrary = ( tabName ) => {
        onToggle(); // Close the dropdown
        toggleFontLibrary( tabName ); // Open the modal
    };

	return (
		<MenuGroup>
			<MenuItem onClick={ () => displayFontLibrary( 'installed-fonts' ) }>{ __( 'Manage Font Library' ) }</MenuItem>
			<MenuItem onClick={ () => displayFontLibrary( 'google-fonts' ) }>{ __( 'Install Google Fonts' ) }</MenuItem>
            <MenuItem onClick={ () => displayFontLibrary( 'local-fonts' ) }>{ __( 'Install Local Fonts' ) }</MenuItem>
		</MenuGroup>
	)	
}

function FontFamilies() {
	const [ fontFamilies ] = useGlobalSetting( 'typography.fontFamilies' );

    const fonts  = Array.isArray( fontFamilies?.custom )
        ? fontFamilies?.custom
        : fontFamilies?.theme || [];

    const [ tabOpen, setTabOpen ] = useState( null );

    const toggleFontLibrary = ( tabName ) => {
        setTabOpen( !!tabOpen ? null : tabName );
    };

	return (
        <>
            { !!tabOpen && (
                <FontLibraryModal
                    onRequestClose={ toggleFontLibrary }
                    initialTabName={ tabOpen }
                />
            )}
            

            <VStack spacing={ 3 }>
                <HStack justify='space-between' >
                    <Subtitle level={ 3 }>{ __( 'Fonts' ) }</Subtitle>
                    <Dropdown
                        renderContent={ ({ onToggle }) => (
                            <FontFamiliesMenu
                                onToggle={ onToggle }
                                toggleFontLibrary={ toggleFontLibrary }
                            />
                        )}
                        renderToggle={ ( { isOpen, onToggle } ) => (
                            <Button onClick={ onToggle } aria-expanded={ isOpen } icon={ moreVertical } isSmall />
                        ) }
                    />
                </HStack>
                <ItemGroup isBordered isSeparated>
                    {fonts.map( family => (
                        <Item key={family.slug}>
                            <HStack justify="flex-start">
                                <FlexItem style={{ fontFamily: family.fontFamily }}>{ family.name || family.fontFamily }</FlexItem>
                            </HStack>
                        </Item>
                    ))}
                </ItemGroup>
            </VStack>
        </>
	);
}

export default FontFamilies;
