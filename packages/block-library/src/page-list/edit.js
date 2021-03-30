/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	BlockControls,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import ServerSideRender from '@wordpress/server-side-render';
import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ConvertToLinksModal from './convert-to-links-modal';

export default function PageListEdit( { context, clientId } ) {
	const { textColor, backgroundColor, showSubmenuIcon, style } =
		context || {};

	const blockProps = useBlockProps( {
		className: classnames( {
			'has-text-color': !! textColor,
			[ `has-${ textColor }-color` ]: !! textColor,
			'has-background': !! backgroundColor,
			[ `has-${ backgroundColor }-background-color` ]: !! backgroundColor,
			'show-submenu-icons': !! showSubmenuIcon,
		} ),
		style: { ...style?.color },
	} );

	const allowConversionToLinks = useSelect(
		( select ) => {
			const { getBlockParentsByBlockName } = select( blockEditorStore );
			return (
				getBlockParentsByBlockName( clientId, 'core/navigation' )
					.length > 0
			);
		},
		[ clientId ]
	);

	const [ isOpen, setOpen ] = useState( false );
	const openModal = () => setOpen( true );
	const closeModal = () => setOpen( false );

	return (
		<>
			{ allowConversionToLinks && (
				<BlockControls group="other">
					<ToolbarButton title={ __( 'Edit' ) } onClick={ openModal }>
						{ __( 'Edit' ) }
					</ToolbarButton>
				</BlockControls>
			) }
			{ allowConversionToLinks && isOpen && (
				<ConvertToLinksModal
					onClose={ closeModal }
					clientId={ clientId }
				/>
			) }
			<div { ...blockProps }>
				<ServerSideRender block="core/page-list" />
			</div>
		</>
	);
}
