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
import { isRTL } from '@wordpress/i18n';
import { chevronRight, chevronLeft } from '@wordpress/icons';

export default function Header( { title, subTitle, actions, onClose } ) {
	const icon = isRTL() ? chevronRight : chevronLeft;
	return (
		<HStack as="header" alignment="left" className="edit-site-page-header">
			<FlexBlock className="edit-site-page-header__page-title">
				<HStack alignment="topLeft">
					{ onClose && (
						<Button
							icon={ icon }
							label={ 'Close' }
							showTooltip={ false }
							onClick={ onClose }
							size="compact"
						/>
					) }
					<Heading
						as="h2"
						level={ 3 }
						weight={ 500 }
						className="edit-site-page-header__title"
					>
						{ title }
					</Heading>
				</HStack>
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
