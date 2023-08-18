/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { getQueryArgs } from '@wordpress/url';
import {
	Button,
	SearchControl,
	__experimentalVStack as VStack,
	Flex,
	FlexItem,
	FlexBlock,
	MenuGroup, MenuItem,
	__experimentalInputControl as InputControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalHeading as Heading,
	__experimentalText as Text,
	__experimentalHStack as HStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import Page from '../page';
// @todo abstract for common usage.
import Pagination from '../page-patterns/pagination';

const EMPTY_ARRAY = [];

// Getting headings, etc based on `mediaType` query type.
function getMediaDetails() {}

export default function PageMedia() {
	const { mediaType } = getQueryArgs( window.location.href );
	const { attachments } = useSelect(
		( select ) => {
			const _attachments = select( coreStore ).getEntityRecords(
				'postType',
				'attachment',
				{
					per_page: 50,
					mime_type: mediaType,
				}
			);
			return {
				attachments: _attachments || EMPTY_ARRAY,
			};
		}, [] );

	return (
		<Page
			className="edit-site-media"
			title={ __( 'Media' ) }
			hideTitleFromUI
		>
			<VStack spacing={ 3 }>
				<HStack justify="space-between">
					<Heading level={ 2 }>{ __( 'Images' ) }</Heading>
					<Button>Upload</Button>
				</HStack>
				<HStack justify="flex-start">
					<DropdownMenu></DropdownMenu>
					<ToggleGroupControl label="my label" value="vertical" isBlock>
						<ToggleGroupControlOption value="horizontal" label="Horizontal" />
						<ToggleGroupControlOption value="vertical" label="Vertical" />
					</ToggleGroupControl>

					{/*<TableView /> or <GridView />*/}
				</HStack>
				<HStack justify="flex-end">
					<Pagination />
				</HStack>
			</VStack>

			{ attachments.map( ( attachment ) => (
				<figure key={ attachment.id }>
					<img src={ attachment.source_url } alt={ attachment.alt_text } />
					<figcaption>{ attachment.title.raw }</figcaption>
				</figure>
			) ) }
		</Page>
	);
}
