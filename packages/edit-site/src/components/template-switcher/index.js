/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';

export default function TemplateSwitcher( { ids, activeId, onActiveIdChange } ) {
	const options = useSelect(
		( select ) => {
			const { getEntityRecord } = select( 'core' );
			return ids.map( ( id ) => {
				const template = getEntityRecord( 'postType', 'wp_template', id );
				return {
					label: template ? template.slug : __( 'loading…' ),
					value: id,
				};
			} );
		},
		[ ids ]
	);
	return (
		<SelectControl
			label={ __( 'Switch Template' ) }
			options={ options }
			value={ activeId }
			onChange={ onActiveIdChange }
			className="edit-site-template-switcher"
		/>
	);
}
