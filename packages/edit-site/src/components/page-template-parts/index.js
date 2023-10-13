/**
 * WordPress dependencies
 */
import {
	VisuallyHidden,
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEntityRecords } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import Page from '../page';
import Table from '../table';
import Link from '../routes/link';
import AddedBy from '../list/added-by';
import PatternActions from '../pattern-actions';
import AddNewTemplatePart from './add-new-template-part';
import { TEMPLATE_PART_POST_TYPE } from '../../utils/constants';
import { unlock } from '../../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );

export default function PageTemplateParts() {
	const {
		params: { didAccessPatternsPage },
	} = useLocation();

	const { records: templateParts } = useEntityRecords(
		'postType',
		TEMPLATE_PART_POST_TYPE,
		{
			per_page: -1,
		}
	);

	const columns = [
		{
			header: __( 'Template Part' ),
			cell: ( templatePart ) => (
				<VStack>
					<Heading as="h3" level={ 5 }>
						<Link
							params={ {
								postId: templatePart.id,
								postType: templatePart.type,
								didAccessPatternsPage: !! didAccessPatternsPage
									? 1
									: undefined,
							} }
							state={ {
								backPath: '/wp_template_part/all',
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
		{
			header: <VisuallyHidden>{ __( 'Actions' ) }</VisuallyHidden>,
			cell: ( templatePart ) => (
				<PatternActions
					postType={ templatePart.type }
					postId={ templatePart.id }
				/>
			),
		},
	];

	return (
		<Page
			title={ __( 'Template Parts' ) }
			actions={ <AddNewTemplatePart /> }
		>
			{ templateParts && (
				<Table data={ templateParts } columns={ columns } />
			) }
		</Page>
	);
}
