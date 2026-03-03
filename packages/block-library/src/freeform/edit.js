/**
 * WordPress dependencies
 */
import {
	BlockControls,
	BlockIcon,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import {
	Button,
	Placeholder,
	ToolbarGroup,
	ToolbarButton,
} from '@wordpress/components';
import { useState, useRef, RawHTML } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { classic } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import ConvertToBlocksButton from './convert-to-blocks-button';
import ModalEdit from './modal';

export default function FreeformEdit( {
	attributes,
	setAttributes,
	clientId,
} ) {
	const { content } = attributes;
	const [ isOpen, setOpen ] = useState( false );
	const editButtonRef = useRef( null );

	const canRemove = useSelect(
		( select ) => select( blockEditorStore ).canRemoveBlock( clientId ),
		[ clientId ]
	);

	return (
		<>
			{ canRemove && (
				<BlockControls>
					<ToolbarGroup>
						<ConvertToBlocksButton clientId={ clientId } />
					</ToolbarGroup>
				</BlockControls>
			) }
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						ref={ editButtonRef }
						onClick={ () => setOpen( true ) }
					>
						{ __( 'Edit' ) }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			<div { ...useBlockProps() }>
				{ content ? (
					<RawHTML>{ content }</RawHTML>
				) : (
					<Placeholder
						icon={ <BlockIcon icon={ classic } /> }
						label={ __( 'Classic' ) }
						instructions={ __(
							'Use the classic editor to add content.'
						) }
					>
						<Button
							__next40pxDefaultSize
							variant="primary"
							onClick={ () => setOpen( true ) }
						>
							{ __( 'Edit contents' ) }
						</Button>
					</Placeholder>
				) }
				{ isOpen && (
					<ModalEdit
						clientId={ clientId }
						content={ content }
						onClose={ () => {
							setOpen( false );
							if ( editButtonRef.current ) {
								editButtonRef.current.focus();
							}
						} }
						onChange={ ( newContent ) =>
							setAttributes( { content: newContent } )
						}
					/>
				) }
			</div>
		</>
	);
}
