/**
 * External dependencies
 */
import { kebabCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import {
	BlockSettingsMenuControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { MenuItem } from '@wordpress/components';
import { createBlock, serialize } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import CreateTemplatePartModal from '../create-template-part-modal';

export default function ConvertToTemplatePart( { clientIds, blocks } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const { saveEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice } = useDispatch( noticesStore );

	const onConvert = async ( { title, area } ) => {
		// Currently template parts only allow latin chars.
		// Fallback slug will receive suffix by default.
		const cleanSlug =
			kebabCase( title ).replace( /[^\w-]+/g, '' ) || 'wp-custom-part';

		const templatePart = await saveEntityRecord(
			'postType',
			'wp_template_part',
			{
				slug: cleanSlug,
				title,
				content: serialize( blocks ),
				area,
			}
		);
		replaceBlocks(
			clientIds,
			createBlock( 'core/template-part', {
				slug: templatePart.slug,
				theme: templatePart.theme,
			} )
		);
		createSuccessNotice( __( 'Template part created.' ), {
			type: 'snackbar',
		} );

		// The modal and this component will be unmounted because of `replaceBlocks` above,
		// so no need to call `closeModal` or `onClose`.
	};

	return (
		<>
			<BlockSettingsMenuControls>
				{ () => (
					<MenuItem
						onClick={ () => {
							setIsModalOpen( true );
						} }
					>
						{ __( 'Make template part' ) }
					</MenuItem>
				) }
			</BlockSettingsMenuControls>
			{ isModalOpen && (
				<CreateTemplatePartModal
					closeModal={ () => {
						setIsModalOpen( false );
					} }
					onCreate={ onConvert }
				/>
			) }
		</>
	);
}
