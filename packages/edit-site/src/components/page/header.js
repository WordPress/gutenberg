/**
 * WordPress dependencies
 */
import {
	__experimentalHeading as Heading,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	FlexBlock,
	FlexItem,
	Button,
} from '@wordpress/components';
import { chevronLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useLink } from '../routes/link';

export default function Header( { title, subTitle, actions, backPath } ) {
	const { onClick } = useLink( {
		path: backPath,
	} );

	return (
		<HStack as="header" alignment="left" className="edit-site-page-header">
			{ backPath && (
				<Button
					className="edit-site-page-header__back"
					onClick={ onClick }
					icon={ chevronLeft }
					label="Back to pages"
				/>
			) }
			<FlexBlock className="edit-site-page-header__page-title">
				<Heading
					as="h2"
					level={ 3 }
					weight={ 500 }
					className="edit-site-page-header__title"
				>
					{ title }
				</Heading>
				{ subTitle && (
					<Text as="p" className="edit-site-page-header__sub-title">
						{ subTitle }
					</Text>
				) }
			</FlexBlock>
			<FlexItem className="edit-site-page-header__actions">
				{ actions }
			</FlexItem>
		</HStack>
	);
}
