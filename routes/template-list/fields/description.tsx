/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { privateApis as corePrivateApis } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useEntityRecordsWithPermissions } = unlock( corePrivateApis );

function useAllDefaultTemplateTypes() {
	const { records: staticRecords } = useEntityRecordsWithPermissions(
		'root',
		'registeredTemplate'
	);
	return staticRecords
		?.filter( ( record: any ) => ! record.is_custom )
		.map( ( record: any ) => {
			return {
				slug: record.slug,
				title: record.title.rendered,
				description: record.description,
			};
		} );
}

export const descriptionField = {
	label: __( 'Description' ),
	id: 'description',
	render: function RenderDescription( { item }: { item: any } ) {
		const defaultTemplateTypes = useAllDefaultTemplateTypes();
		const defaultTemplateType = defaultTemplateTypes?.find(
			( type: any ) => type.slug === item.slug
		);
		return item.description
			? decodeEntities( item.description )
			: defaultTemplateType?.description;
	},
	enableSorting: false,
	enableGlobalSearch: true,
};
