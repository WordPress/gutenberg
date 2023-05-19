/**
 * WordPress dependencies
 */
import {
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import Page from '../page';
import FilterBar from '../filter-bar';
import Table from '../table';
import Link from '../routes/link';
import AddedBy from '../list/added-by';
import AddNewTemplate from '../add-new-template';
import { store as editSiteStore } from '../../store';

export default function PageMainTemplates() {
	const [ filteredRecords, setFilteredRecords ] = useState( [] );

	const { records: allTemplateParts } = useEntityRecords(
		'postType',
		'wp_template_part',
		{
			per_page: -1,
		}
	);

	const templateParts = useSelect(
		( select ) =>
			allTemplateParts?.filter(
				( template ) =>
					! select( coreStore ).isDeletingEntityRecord(
						'postType',
						'wp_template_part',
						template.id
					)
			),
		[ allTemplateParts ]
	);

	useEffect( () => {
		setFilteredRecords( templateParts );
	}, [ templateParts ] );

	const { canCreate } = useSelect( ( select ) => {
		const { supportsTemplatePartsMode } =
			select( editSiteStore ).getSettings();
		return {
			postType: select( coreStore ).getPostType( 'wp_template_part' ),
			canCreate: ! supportsTemplatePartsMode,
		};
	} );

	const handleFilter = ( newRecords ) => {
		setFilteredRecords( newRecords );
	};

	const columns = [
		{
			header: __( 'Template Part' ),
			cell: ( templatePart ) => (
				<VStack>
					<Heading level={ 5 }>
						<Link
							params={ {
								postId: templatePart.id,
								postType: templatePart.type,
								canvas: 'edit',
							} }
						>
							{ decodeEntities(
								templatePart.title?.rendered ||
									templatePart.slug
							) }
						</Link>
					</Heading>
				</VStack>
			),
			maxWidth: 400,
		},
		{
			header: __( 'Added by' ),
			cell: ( templatePart ) => (
				<AddedBy
					postType={ templatePart.type }
					postId={ templatePart.id }
				/>
			),
		},
	];

	return (
		<Page
			title={ __( 'Template Parts' ) }
			actions={
				canCreate && (
					<AddNewTemplate
						templateType={ 'wp_template_part' }
						showIcon={ false }
						toggleProps={ { variant: 'primary' } }
					/>
				)
			}
		>
			<HStack>
				<FilterBar
					data={ templateParts }
					onFilter={ handleFilter }
					properties={ [
						{
							key: 'title.raw',
							type: 'search',
							placeholder: 'Search template parts...',
							label: 'Search template parts...',
						},
					] }
				/>
			</HStack>
			<Table data={ filteredRecords } columns={ columns } />
		</Page>
	);
}
