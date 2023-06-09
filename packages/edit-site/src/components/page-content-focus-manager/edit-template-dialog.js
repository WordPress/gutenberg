/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

/**
 * Component that displays a 'Edit your template to edit this block'
 * notification when the user is focusing on editing page content and clicks on
 * a disabled template block.
 *
 * @param {Object}                                 props
 * @param {import('react').RefObject<HTMLElement>} props.contentRef Ref to the block
 *                                                                  editor iframe canvas.
 */
export default function EditTemplateDialog( { contentRef } ) {
	const [ isOpen, setIsOpen ] = useState( false );

	useEffect( () => {
		const handleDblClick = ( event ) => {
			if ( event.target.classList.contains( 'is-root-container' ) ) {
				setIsOpen( true );
			}
		};
		const canvas = contentRef.current;
		canvas?.addEventListener( 'dblclick', handleDblClick );
		return () => canvas?.removeEventListener( 'dblclick', handleDblClick );
	}, [ contentRef.current ] );

	const { setHasPageContentFocus } = useDispatch( editSiteStore );

	return (
		<ConfirmDialog
			isOpen={ isOpen }
			confirmButtonText={ __( 'Edit template' ) }
			onConfirm={ () => {
				setIsOpen( false );
				setHasPageContentFocus( false );
			} }
			onCancel={ () => setIsOpen( false ) }
		>
			{ __( 'Edit your template to edit this block' ) }
		</ConfirmDialog>
	);
}
