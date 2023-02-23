/**
 * External dependencies
 */
import { mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { TextControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';

export default function EditTemplateTitle() {
	const [ forceEmpty, setForceEmpty ] = useState( false );
	const { template } = useSelect( ( select ) => {
		const { getEditedPostTemplate } = select( editPostStore );
		return {
			template: getEditedPostTemplate(),
		};
	}, [] );

	const { editEntityRecord } = useDispatch( coreStore );
	const { getEditorSettings } = useSelect( editorStore );
	const { updateEditorSettings } = useDispatch( editorStore );

	// Only user-created and non-default templates can change the name.
	if ( ! template.is_custom || template.has_theme_file ) {
		return null;
	}

	let templateTitle = __( 'Default' );
	if ( template?.title ) {
		templateTitle = template.title;
	} else if ( !! template ) {
		templateTitle = template.slug;
	}

	return (
		<div className="edit-site-template-details__group">
			<TextControl
				__nextHasNoMarginBottom
				label={ __( 'Title' ) }
				value={ forceEmpty ? '' : templateTitle }
				help={ __(
					'Give the template a title that indicates its purpose, e.g. "Full Width".'
				) }
				onChange={ ( newTitle ) => {
					// Allow having the field temporarily empty while typing.
					if ( ! newTitle && ! forceEmpty ) {
						setForceEmpty( true );
						return;
					}
					setForceEmpty( false );

					const settings = getEditorSettings();
					const newAvailableTemplates = mapValues(
						settings.availableTemplates,
						( existingTitle, id ) => {
							if ( id !== template.slug ) {
								return existingTitle;
							}
							return newTitle;
						}
					);
					updateEditorSettings( {
						...settings,
						availableTemplates: newAvailableTemplates,
					} );
					editEntityRecord( 'postType', 'wp_template', template.id, {
						title: newTitle,
					} );
				} }
				onBlur={ () => setForceEmpty( false ) }
			/>
		</div>
	);
}
