/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
	Flex,
} from '@wordpress/components';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { getMediaItem } from './get-media';
import { useLink } from '../routes/link';
import { unlock } from '../../lock-unlock';
import MediaActions from './media-actions';

const { useLocation } = unlock( routerPrivateApis );

function GridItem( { item } ) {
	const {
		params: { path, ...params },
	} = useLocation();

	const mediaType = path.split( '/media/' )[ 1 ];
	const linkProps = useLink( {
		...params,
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
				<MediaActions
					attachmentId={ item.id }
					toggleProps={ { isSmall: true } }
				/>
			</HStack>
		</li>
	);
}

export default GridItem;
