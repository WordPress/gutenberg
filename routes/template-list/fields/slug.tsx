/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
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

export const slugField = {
	label: __( 'Template Type' ),
	id: 'slug',
	getValue: ( { item }: { item: any } ) => item.slug,
	render: function Render( { item }: { item: any } ) {
		const defaultTemplateTypes = useAllDefaultTemplateTypes();
		const defaultTemplateType = defaultTemplateTypes?.find(
			( type: any ) => type.slug === item.slug
		);
		return defaultTemplateType?.title || _x( 'Custom', 'template type' );
	},
};
