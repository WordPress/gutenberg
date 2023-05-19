/**
 * WordPress dependencies
 */
import {
	VisuallyHidden,
	__experimentalHeading as Heading,
	__experimentalText as Text,
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
import Actions from '../list/actions';
import AddNewTemplate from '../add-new-template';
import { store as editSiteStore } from '../../store';

export default function PageMainTemplates() {
	const [ filteredRecords, setFilteredRecords ] = useState( [] );

	const { records: allTemplates } = useEntityRecords(
		'postType',
		'wp_template',
		{
			per_page: -1,
		}
	);

	const templates = useSelect(
		( select ) =>
			allTemplates?.filter(
				( template ) =>
					! select( coreStore ).isDeletingEntityRecord(
						'postType',
						'wp_template',
						template.id
					)
			),
		[ allTemplates ]
	);

	useEffect( () => {
		setFilteredRecords( templates );
	}, [ templates ] );

	const { canCreate } = useSelect( ( select ) => {
		const { supportsTemplatePartsMode } =
			select( editSiteStore ).getSettings();
		return {
			postType: select( coreStore ).getPostType( 'wp_template' ),
			canCreate: ! supportsTemplatePartsMode,
		};
	} );

	const handleFilter = ( newRecords ) => {
		setFilteredRecords( newRecords );
	};

	const columns = [
		{
			header: __( 'Template' ),
			cell: ( template ) => (
				<VStack>
					<Heading level={ 5 }>
						<Link
							params={ {
								postId: template.id,
								postType: template.type,
								canvas: 'edit',
							} }
						>
							{ decodeEntities(
								template.title?.rendered || template.slug
							) }
						</Link>
					</Heading>
					<Text variant="muted">
						{ decodeEntities( template.description ) }
					</Text>
				</VStack>
			),
			maxWidth: 400,
		},
		{
			header: __( 'Added by' ),
			cell: ( template ) => (
				<AddedBy postType={ template.type } postId={ template.id } />
			),
		},
		{
			header: <VisuallyHidden>{ __( 'Actions' ) }</VisuallyHidden>,
			cell: ( template ) => <Actions template={ template } />,
		},
	];

	return (
		<Page
			title={ __( 'Templates' ) }
			actions={
				canCreate && (
					<AddNewTemplate
						templateType={ 'wp_template' }
						showIcon={ false }
						toggleProps={ { variant: 'primary' } }
					/>
				)
			}
		>
			<HStack>
				<FilterBar
					data={ templates }
					onFilter={ handleFilter }
					properties={ [
						{
							key: 'title.raw',
							type: 'search',
							placeholder: 'Search templates...',
							label: 'Search templates...',
						},
					] }
				/>
				{ /* <ToggleGroupControl
					__nextHasNoMarginBottom
					label="view type"
					value="list"
					isBlock
					size="__unstable-large"
					hideLabelFromVision
				>
					<ToggleGroupControlOptionIcon
						icon={ menu }
						value="list"
						label="List"
					/>
					<ToggleGroupControlOptionIcon
						icon={ grid }
						value="grid"
						label="Grid"
					/>
				</ToggleGroupControl> */ }
			</HStack>
			<Table data={ filteredRecords } columns={ columns } />
		</Page>
	);
}
