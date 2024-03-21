/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { BlockControls } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { ToolbarButton } from '@wordpress/components';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';

function EditTemplatePartMenuItem( { attributes } ) {
	const { theme, slug } = attributes;
	const { templatePart, onNavigateToEntityRecord } = useSelect(
		( select ) => {
			const { getCurrentTheme, getEntityRecord } = select( coreStore );
			const { getEditorSettings } = select( editorStore );
			return {
				templatePart: getEntityRecord(
					'postType',
					'wp_template_part',
					// Ideally this should be an official public API.
					`${ theme || getCurrentTheme()?.stylesheet }//${ slug }`
				),
				onNavigateToEntityRecord:
					getEditorSettings().onNavigateToEntityRecord,
			};
		},
		[ theme, slug ]
	);

	if ( ! templatePart || ! onNavigateToEntityRecord ) {
		return null;
	}

	return (
		<ToolbarButton
			onClick={ () => {
				onNavigateToEntityRecord( {
					postId: templatePart.id,
					postType: templatePart.type,
				} );
			} }
		>
			{ __( 'Edit' ) }
		</ToolbarButton>
	);
}

export const withEditBlockControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { attributes, name } = props;
		const isDisplayed = name === 'core/template-part' && attributes.slug;

		return (
			<>
				<BlockEdit key="edit" { ...props } />
				{ isDisplayed && (
					<BlockControls group="other">
						<EditTemplatePartMenuItem attributes={ attributes } />
					</BlockControls>
				) }
			</>
		);
	},
	'withEditBlockControls'
);

addFilter(
	'editor.BlockEdit',
	'core/editor/template-part-edit-button',
	withEditBlockControls
);
