/**
 * WordPress dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { StyleVariationsContainer, StyleBook } from '@wordpress/edit-site';
import {
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	Flex,
	FlexItem,
} from '@wordpress/components';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

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
				<VStack>
					<Heading level={ 2 }>{ __( 'Choose your style' ) }</Heading>
					<p>
						{ __(
							"Your style will define how the rest of your website looks. Don't worry, you can change that later."
						) }
					</p>
				</VStack>
				<StyleVariationsContainer onSelect={ setVariation } />
			</FlexItem>
			<FlexItem isBlock>
				<div className="onboarding-style-book">
					<StyleBook.Slot>
						{ ( [ styleBook ] ) => (
							<div className="onboarding-style-book__container">
								{ styleBook }
							</div>
						) }
					</StyleBook.Slot>
				</div>
			</FlexItem>
		</Flex>
	);
}
