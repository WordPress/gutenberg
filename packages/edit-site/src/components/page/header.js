/**
 * WordPress dependencies
 */
import {
	__experimentalHeading as Heading,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	FlexItem,
} from '@wordpress/components';

/**
 * Internal dependencies
 */

export default function Header( { title, subTitle, actions } ) {
	return (
		<VStack className="edit-site-page-header" as="header" spacing={ 0 }>
			<HStack className="edit-site-page-header__page-title">
				<Heading
					as="h2"
					level={ 3 }
					weight={ 500 }
					className="edit-site-page-header__title"
				>
					{ title }
				</Heading>
				<FlexItem className="edit-site-page-header__actions">
					{ actions }
				</FlexItem>
			</HStack>
			{ subTitle && (
				<Text
					variant="muted"
					as="p"
					className="edit-site-page-header__sub-title"
				>
					{ subTitle }
				</Text>
			) }
		</VStack>
	);
}
