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
	DropdownMenu,
	Flex,
	FlexItem,
	FlexBlock,
	MenuGroup,
	MenuItem,
	__experimentalInputControl as InputControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
	__experimentalHeading as Heading,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalSpacer as Spacer,
	SelectControl,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { grid, list } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Page from '../page';
// @todo abstract for common usage.
import Pagination from '../page-patterns/pagination';
import FilterControl from './filter-control';

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
	const [ tagsFilter, setTagsFilter ] = useState( [] );
	const [ authorFilter, setAuthorFilter ] = useState( [] );
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
					<InputControl
						placeholder={ __( 'Search' ) }
						size="__unstable-large"
					/>
					<FilterControl
						label={ __( 'Tags' ) }
						value={ tagsFilter }
						options={ [
							{ label: __( 'Abstract' ), value: 'abstract' },
							{ label: __( 'New' ), value: 'new' },
							{ label: __( 'Featured' ), value: 'featured' },
							{ label: __( 'Nature' ), value: 'nature' },
							{
								label: __( 'Architecture' ),
								value: 'architecture',
							},
						] }
						onChange={ setTagsFilter }
					/>
					<FilterControl
						label={ __( 'Author' ) }
						value={ authorFilter }
						options={ [
							{ label: __( 'Saxon' ), value: 'saxon' },
							{ label: __( 'Isabel' ), value: 'isabel' },
							{ label: __( 'Ramon' ), value: 'ramon' },
							{ label: __( 'Andy' ), value: 'andy' },
							{
								label: __( 'Kai' ),
								value: 'kai',
							},
							{ label: __( 'Rob' ), value: 'rob' },
						] }
						onChange={ setAuthorFilter }
					/>
					<Spacer />
					<SelectControl
						label={ __( 'Sort: Date' ) }
						options={ [
							{ label: 'Big', value: '100%' },
							{ label: 'Medium', value: '50%' },
							{ label: 'Small', value: '25%' },
						] }
						hideLabelFromVision
						__nextHasNoMarginBottom
						size="__unstable-large"
					/>
					<ToggleGroupControl
						label={ __( 'Toggle view' ) }
						hideLabelFromVision
						value="table"
						__nextHasNoMarginBottom
						size="__unstable-large"
					>
						<ToggleGroupControlOptionIcon
							value="grid"
							label={ __( 'Grid' ) }
							icon={ list }
						/>
						<ToggleGroupControlOptionIcon
							value="table"
							label={ __( 'Table' ) }
							icon={ grid }
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
