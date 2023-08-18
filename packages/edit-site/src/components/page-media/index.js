/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { getQueryArgs } from '@wordpress/url';
import {
	Button,
	__experimentalVStack as VStack,
	DropdownMenu,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import Page from '../page';
// @todo abstract for common usage.
import Pagination from '../page-patterns/pagination';

const EMPTY_ARRAY = [];

// Getting headings, etc. based on `mediaType` query type.
function getMediaDetails( mediaType ) {
	if ( 'document' === mediaType ) {
		return {
			heading: __( 'Documents' ),
		};
	}

	if ( 'audio' === mediaType ) {
		return {
			heading: __( 'Audio' ),
		};
	}

	if ( 'video' === mediaType ) {
		return {
			heading: __( 'Videos' ),
		};
	}

	return {
		heading: __( 'Images' ),
	};
}

export default function PageMedia() {
	const { mediaType } = getQueryArgs( window.location.href );
	const { attachments } = useSelect(
		( select ) => {
			const _attachments = select( coreStore ).getMediaItems( {
				per_page: 50,
				orderby: 'date',
				order: 'desc',
				// @todo `application` and `text` are valid media types,
				// but we should maybe combine them into `documents`.
				media_type: mediaType,
			} );
			return {
				attachments: _attachments || EMPTY_ARRAY,
			};
		},
		[ mediaType ]
	);

	const { heading } = getMediaDetails( mediaType );

	return (
		<Page
			className="edit-site-media"
			title={ __( 'Media' ) }
			hideTitleFromUI
		>
			<VStack spacing={ 3 }>
				<HStack justify="space-between">
					<Heading level={ 2 }>{ heading }</Heading>
					<Button>Upload</Button>
				</HStack>
				<HStack justify="flex-start">
					<DropdownMenu></DropdownMenu>
					<ToggleGroupControl
						label="my label"
						value="vertical"
						isBlock
					>
						<ToggleGroupControlOption
							value="horizontal"
							label="Horizontal"
						/>
						<ToggleGroupControlOption
							value="vertical"
							label="Vertical"
						/>
					</ToggleGroupControl>

					{ /*<TableView /> or <GridView />*/ }
				</HStack>
				<HStack justify="flex-end">
					<Pagination />
				</HStack>
			</VStack>
		</Page>
	);
}
