/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import {
	MenuItem,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { useState } from '@wordpress/element';

export default function ConvertToRegularBlocks( { clientId, onClose } ) {
	const [ showConfirmDialog, setShowConfirmDialog ] = useState( false );

	const { getBlocks } = useSelect( blockEditorStore );
	const { replaceBlocks } = useDispatch( blockEditorStore );

	const { canRemove, templatePartTitle } = useSelect(
		( select ) => {
			const { canRemoveBlock, getBlock } = select( blockEditorStore );
			const { getEntityRecord, getCurrentTheme } = select( coreStore );

			const block = getBlock( clientId );
			const { slug, theme } = block?.attributes ?? {};
			const themeSlug = theme || getCurrentTheme()?.stylesheet;
			const templatePartId =
				themeSlug && slug ? `${ themeSlug }//${ slug }` : null;
			const entity = templatePartId
				? getEntityRecord(
						'postType',
						'wp_template_part',
						templatePartId
				  )
				: null;

			return {
				canRemove: canRemoveBlock( clientId ),
				templatePartTitle: entity?.title?.rendered
					? decodeEntities( entity.title.rendered )
					: null,
			};
		},
		[ clientId ]
	);

	if ( ! canRemove ) {
		return null;
	}

	const title = templatePartTitle
		? sprintf(
				/* translators: %s: template part title, e.g. "Header" */
				__( 'Detach %s?' ),
				templatePartTitle
		  )
		: __( 'Detach template part?' );

	const message = templatePartTitle
		? sprintf(
				/* translators: %s: template part title, e.g. "Header" */
				__(
					'The blocks will be separated from the original template part and will be fully editable. Future changes to the %s template part will not apply here.'
				),
				templatePartTitle
		  )
		: __(
				'The blocks will be separated from the original template part and will be fully editable. Future changes to the template part will not apply here.'
		  );

	return (
		<>
			<MenuItem onClick={ () => setShowConfirmDialog( true ) }>
				{ __( 'Detach' ) }
			</MenuItem>
			<ConfirmDialog
				isOpen={ showConfirmDialog }
				onConfirm={ () => {
					replaceBlocks( clientId, getBlocks( clientId ) );
					onClose();
				} }
				onCancel={ () => setShowConfirmDialog( false ) }
				confirmButtonText={ __( 'Detach' ) }
				size="medium"
				title={ title }
				__experimentalHideHeader={ false }
			>
				{ message }
			</ConfirmDialog>
		</>
	);
}
