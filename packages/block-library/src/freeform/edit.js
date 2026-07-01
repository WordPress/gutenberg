/**
 * WordPress dependencies
 */
import {
	BlockControls,
	BlockIcon,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
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
import MigrationNotice from './migration-notice';
import ModalEdit from './modal';

export default function FreeformEdit( {
	attributes,
	setAttributes,
	clientId,
	onReplace,
} ) {
	const { content } = attributes;
	const [ isOpen, setOpen ] = useState( false );
	const editButtonRef = useRef( null );

	const canRemove = useSelect(
		( select ) => select( blockEditorStore ).canRemoveBlock( clientId ),
		[ clientId ]
	);
	const { removeBlock } = useDispatch( blockEditorStore );

	return (
		<>
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
				{ canRemove && content && (
					<MigrationNotice
						content={ content }
						onReplace={ onReplace }
					/>
				) }
				{ content ? (
					<RawHTML>{ content }</RawHTML>
				) : (
					<Placeholder
						icon={ <BlockIcon icon={ classic } /> }
						label={ __( 'Classic' ) }
						instructions={ __(
							'The Classic block is being phased out. It’s recommended to use other blocks for the best editing experience.'
						) }
					>
						{ canRemove && (
							<Button
								__next40pxDefaultSize
								variant="primary"
								onClick={ () => removeBlock( clientId ) }
							>
								{ __( 'Remove block' ) }
							</Button>
						) }
						<Button
							__next40pxDefaultSize
							variant={ canRemove ? 'secondary' : 'primary' }
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
