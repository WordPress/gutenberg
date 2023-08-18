/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
	DropdownMenu,
	MenuGroup,
	MenuItem,
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
	Flex,
} from '@wordpress/components';
import { moreHorizontal } from '@wordpress/icons';

function GridItem( { item } ) {
	return (
		<li className={ 'edit-site-media__item-container' }>
			<img
				src={ item.source_url }
				alt={ item.title.rendered }
				className={ 'edit-site-media__item' }
			/>
			<HStack className="edit-site-media__footer" justify="space-between">
				<HStack
					alignment="center"
					justify="left"
					spacing={ 3 }
					className="edit-site-media__title"
				>
					<Flex as="span" gap={ 0 } justify="left">
						<Heading level={ 5 }>
							<Button>{ item.title.rendered }</Button>
						</Heading>
					</Flex>
				</HStack>
				<DropdownMenu
					icon={ moreHorizontal }
					label={ __( 'Actions' ) }
					className="edit-site-media__dropdown"
					popoverProps={ { placement: 'bottom-end' } }
					toggleProps={ {
						className: 'edit-site-patterns__button',
						isSmall: true,
					} }
				>
					{ ( { onClose } ) => (
						<MenuGroup>
							<MenuItem onClose={ onClose }>TODO</MenuItem>
						</MenuGroup>
					) }
				</DropdownMenu>
			</HStack>
		</li>
	);
}

export default GridItem;
