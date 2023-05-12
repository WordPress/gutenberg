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
import { DEMO_TEXT } from "./constants";


function FontCard ( { font, onClick, actionHandler, elevation } ) {
    return (
        <div onClick={ onClick }>
            <Card
                elevation={ elevation }
            >
                <CardBody>
                    <VStack gap={3}>
                        <HStack justify="space-between">
                            <Heading level={3}>{ font.name }</Heading>
                            { !!actionHandler && (actionHandler) }
                        </HStack>
                        <Heading level={4}>{font.variantsCount} { _n( "variant", "variants", font.variantsCount ) }</Heading>
                        <Text>{ DEMO_TEXT }</Text>
                    </VStack>
                </CardBody>
            </Card>
        </div>
    );
}

export default FontCard;
