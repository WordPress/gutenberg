/**
 * WordPress dependencies
 */
import {
	VisuallyHidden,
	__experimentalHeading as Heading,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import Page from '../page';
import Table from '../table';
import Link from '../routes/link';
import AddedBy from '../list/added-by';
import TemplateActions from '../template-actions';
import AddNewTemplate from '../add-new-template';
import { store as editSiteStore } from '../../store';

export default function PageTemplates() {
	const { records: templates } = useEntityRecords(
		'postType',
		'wp_template',
		{
			per_page: -1,
		}
	);

	const { canCreate } = useSelect( ( select ) => {
		const { supportsTemplatePartsMode } =
			select( editSiteStore ).getSettings();
		return {
			postType: select( coreStore ).getPostType( 'wp_template' ),
			canCreate: ! supportsTemplatePartsMode,
		};
	} );

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
					{ template.description && (
						<Text variant="muted">
							{ decodeEntities( template.description ) }
						</Text>
					) }
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
			cell: ( template ) => (
				<TemplateActions
					postType={ template.type }
					postId={ template.id }
				/>
			),
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
			{ templates && <Table data={ templates } columns={ columns } /> }
		</Page>
	);
}
