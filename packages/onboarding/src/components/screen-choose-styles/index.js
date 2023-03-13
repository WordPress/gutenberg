/**
 * WordPress dependencies
 */
// eslint-disable-next-line no-restricted-imports

// eslint-disable-next-line no-restricted-imports
import {
	GlobalStylesProvider,
	GlobalStylesRenderer,
	store as editSiteStore,
	StyleVariationsContainer,
	StyleBook,
} from '@wordpress/edit-site';
import {
	BlockEditorProvider,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import {
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	Flex,
	FlexItem,
} from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { unlock } from '../../private-apis';

export default function ScreenChooseStyles( { setVariation } ) {
	const settings = useSelect(
		( select ) => select( editSiteStore ).getSettings(),
		[]
	);
	const { useGlobalStylesReset } = unlock( blockEditorPrivateApis );
	const [ , onReset ] = useGlobalStylesReset();
	useEffect( onReset, [ onReset ] );
	return (
		<GlobalStylesProvider>
			<GlobalStylesRenderer />
			<BlockEditorProvider settings={ settings }>
				<Flex
					justify="flex-start"
					align="stretch"
					gap={ 8 }
					className="onboarding-screen-choose-styles"
				>
					<FlexItem className="onboarding-screen-choose-styles__variations">
						<VStack>
							<Heading level={ 2 }>
								{ __( 'Choose your style' ) }
							</Heading>
							<p>
								{ __(
									"Your style will define how the rest of your website looks. Don't worry, you can change that later."
								) }
							</p>
						</VStack>
						<StyleVariationsContainer onSelect={ setVariation } />
					</FlexItem>
					<FlexItem
						isBlock
						className="onboarding-screen-choose-styles__stylebook"
					>
						<StyleBook
							isSelected={ () => {} }
							onSelect={ () => {} }
						/>
						<StyleBook.Slot>
							{ ( [ styleBook ] ) => <div>{ styleBook }</div> }
						</StyleBook.Slot>
					</FlexItem>
				</Flex>
			</BlockEditorProvider>
		</GlobalStylesProvider>
	);
}
