/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export function PostTemplate() {
	const { availableTemplates, selectedTemplate, isViewable } = useSelect(
		( select ) => {
			const {
				getEditedPostAttribute,
				getEditorSettings,
				getCurrentPostType,
			} = select( editorStore );
			const { getPostType } = select( coreStore );

			return {
				selectedTemplate: getEditedPostAttribute( 'template' ),
				availableTemplates: getEditorSettings().availableTemplates,
				isViewable:
					getPostType( getCurrentPostType() )?.viewable ?? false,
			};
		},
		[]
	);

	const { editPost } = useDispatch( editorStore );

	if ( ! isViewable || isEmpty( availableTemplates ) ) {
		return null;
	}

	return (
		<SelectControl
			__nextHasNoMarginBottom
			label={ __( 'Template:' ) }
			value={ selectedTemplate }
			onChange={ ( templateSlug ) => {
				editPost( {
					template: templateSlug || '',
				} );
			} }
			options={ Object.entries( availableTemplates ?? {} ).map(
				( [ templateSlug, templateName ] ) => ( {
					value: templateSlug,
					label: templateName,
				} )
			) }
		/>
	);
}

export default PostTemplate;
