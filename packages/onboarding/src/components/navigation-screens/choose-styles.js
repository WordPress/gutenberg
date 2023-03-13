/**
 * WordPress dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { StyleVariationsContainer, StyleBook } from '@wordpress/edit-site';
import {
	__experimentalVStack as VStack,
	Flex,
	FlexItem,
} from '@wordpress/components';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../private-apis';
export default function ChooseStyles( { setVariation } ) {
	const { useGlobalStylesReset } = unlock( blockEditorPrivateApis );
	const [ , onReset ] = useGlobalStylesReset();
	useEffect( onReset, [ onReset ] );
	return (
		<Flex justify="flex-start" align="stretch" gap={ 8 }>
			<FlexItem className="onboarding-styles-list-container">
				<StyleVariationsContainer onSelect={ setVariation } />
			</FlexItem>
			<FlexItem className="onboarding-style-book" isBlock>
				<VStack alignment="topLeft">
					<StyleBook.Slot>
						{ ( [ styleBook ] ) => (
							<div className="onboarding-style-book__container">
								{ styleBook }
							</div>
						) }
					</StyleBook.Slot>
				</VStack>
			</FlexItem>
		</Flex>
	);
}
