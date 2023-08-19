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
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { getMediaItem } from './get-media';
import { useLink } from '../routes/link';
import { unlock } from '../../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );

function GridItem( { item } ) {
	const {
		params: { path },
	} = useLocation();

	const mediaType = path.split( '/media/' )[ 1 ];
	const linkProps = useLink( {
		postType: 'attachment',
		mediaType,
		postId: item.id,
	} );
	return (
		<li className="edit-site-media__item-container">
			<Button
				{ ...linkProps }
				aria-label={ item.title.rendered }
				className="edit-site-media__image-button"
			>
				{ getMediaItem( item, 'large' ) }
			</Button>
			<HStack className="edit-site-media__footer" justify="space-between">
				<HStack
					alignment="center"
					justify="left"
					spacing={ 3 }
					className="edit-site-media__title"
				>
					<Flex as="span" gap={ 0 } justify="left">
						<Heading level={ 5 }>
							<Button { ...linkProps }>
								{ item.title.rendered }
							</Button>
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
