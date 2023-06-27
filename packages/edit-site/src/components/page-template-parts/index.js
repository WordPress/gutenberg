/**
 * WordPress dependencies
 */
import {
	VisuallyHidden,
	__experimentalHeading as Heading,
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

export default function PageTemplateParts() {
	const { records: templateParts } = useEntityRecords(
		'postType',
		'wp_template_part',
		{
			per_page: -1,
		}
	);

	const { canCreate } = useSelect( ( select ) => {
		const { supportsTemplatePartsMode } =
			select( editSiteStore ).getSettings();
		return {
			postType: select( coreStore ).getPostType( 'wp_template_part' ),
			canCreate: ! supportsTemplatePartsMode,
		};
	} );

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
								canvas: 'view',
							} }
							state={ { backPath: '/wp_template_part/all' } }
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
		{
			header: <VisuallyHidden>{ __( 'Actions' ) }</VisuallyHidden>,
			cell: ( templatePart ) => (
				<TemplateActions
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
			{ templateParts && (
				<Table data={ templateParts } columns={ columns } />
			) }
		</Page>
	);
}
