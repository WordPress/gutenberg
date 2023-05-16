/**
 * WordPress dependencies
 */
import { __, _n } from "@wordpress/i18n";
import {
    Card,
    CardBody,
    __experimentalText as Text,
    __experimentalHeading as Heading,
    __experimentalVStack as VStack,
    __experimentalHStack as HStack,
} from "@wordpress/components";

/**
 * Internal dependencies
 */
import FontFaceDemo from "./font-demo";



function FontCard ( { font, onClick, actionHandler, demoText } ) {

    const fakeFontFace = {
        fontStyle: 'normal',
        fontWeight: '400',
        fontFamily: font.fontFamily,
    };

    const displayFontFace = (font.fontFace && font.fontFace.length)
        ? font?.fontFace?.find( face => face.fontStyle === 'normal' && face.fontWeight === '400') || font.fontFace[0]
        : fakeFontFace;

    const variantsCount = font.fontFace?.length || 1;
    
    return (
        <div onClick={ onClick }>
            <Card>
                <CardBody>
                    <VStack gap={3}>
                        <HStack justify="space-between">
                            <Text>{ font.name }</Text>
                            { !!actionHandler && (actionHandler) }
                        </HStack>
                        <Text>{variantsCount} { _n( "variant", "variants", variantsCount ) }</Text>
                        <FontFaceDemo fontFace={ displayFontFace } />
                    </VStack>
                </CardBody>
            </Card>
        </div>
    );
}

export default FontCard;
