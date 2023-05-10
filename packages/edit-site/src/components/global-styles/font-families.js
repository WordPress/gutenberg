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

    const displayFontLibrary = () => {
        onToggle(); // Close the dropdown
        toggleFontLibrary(); // Open the modal
    };

	return (
		<MenuGroup>
			<MenuItem onClick={ displayFontLibrary }>{ __( 'Manage Font Library' ) }</MenuItem>
			<MenuItem>{ __( 'Install Google Fonts' ) }</MenuItem>
            <MenuItem>{ __( 'Install Local Fonts' ) }</MenuItem>
		</MenuGroup>
	)	
}

function FontFamilies() {
	const [ fontFamilies ] = useGlobalSetting( 'typography.fontFamilies' );
	const themeFontFamilies = fontFamilies?.theme  || [];
    const [ isFontLibraryModalOpen, setIsFontLibraryModalOpen ] = useState( false );

    const toggleFontLibrary = () => {
        setIsFontLibraryModalOpen( !isFontLibraryModalOpen );
    };

	return (
        <>
            { isFontLibraryModalOpen && (
                <FontLibraryModal
                    onRequestClose={ toggleFontLibrary }
                />
            )}
            

            <VStack spacing={ 3 }>
                <HStack justify='space-between' >
                    <Subtitle level={ 3 }>{ __( 'Fonts Available' ) }</Subtitle>
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
                    {themeFontFamilies.map( family => (
                        <Item key={family.slug}>
                            <HStack justify="flex-start">
                                <FlexItem>
                                    <Text>{ __( 'Aa' ) }</Text>
                                </FlexItem>
                                <FlexItem>{ family.name }</FlexItem>
                            </HStack>
                        </Item>
                    ))}
                </ItemGroup>
            </VStack>
        </>
	);
}

export default FontFamilies;
