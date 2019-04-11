/**
 * External dependencies
 */
import { isEmpty, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';

export function PageTemplate( { availableTemplates, selectedTemplate, onUpdate } ) {
	if ( isEmpty( availableTemplates ) ) {
		return null;
	}
	return (
		<SelectControl
			label={ __( 'Template:' ) }
			value={ selectedTemplate }
			onChange={ onUpdate }
			className="editor-page-attributes__template"
			options={
				map( availableTemplates, ( templateName, templateSlug ) => ( {
					value: templateSlug,
					label: templateName,
				} ) )
			}
		/>
	);
}

export default compose(
	withSelect( ( select ) => {
		const { getEditedPostAttribute, getEditorSettings } = select( 'core/editor' );
		const { availableTemplates } = getEditorSettings();
		return {
			selectedTemplate: getEditedPostAttribute( 'template' ),
			availableTemplates,
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		onUpdate( templateSlug ) {
			dispatch( 'core/editor' ).editPost( { template: templateSlug || '' } );
		},
	} ) ),
)( PageTemplate );
