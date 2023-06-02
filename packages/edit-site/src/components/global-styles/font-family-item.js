/**
 * WordPress dependencies
 */
import { _n } from '@wordpress/i18n';
import {
	__experimentalHStack as HStack,
	__experimentalItem as Item,
	FlexItem,
} from '@wordpress/components';

/**
 * Internal dependencies
 */

function FontFamilyItem ({ font }) {

    const variantsCount = font?.fontFace?.length || 1;

    return (
        <Item>
            <HStack justify="space-between">
                <FlexItem
                    style={ { fontFamily: font.fontFamily } }
                >
                    { font.name || font.fontFamily }
                </FlexItem>
                <FlexItem
                    style={ { color: "#9e9e9e" } }
                >
                    { variantsCount }
                    { ' ' }
                    { _n(
                        'variant',
                        'variants',
                        variantsCount
                    ) }
                </FlexItem>

            </HStack>
        </Item>
    );
}

export default FontFamilyItem;
