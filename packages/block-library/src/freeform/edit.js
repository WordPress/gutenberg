/**
 * WordPress dependencies
 */
import {
	BlockControls,
	BlockIcon,
	Warning,
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
import { rawHandler, serialize } from '@wordpress/blocks';

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

	const { canRemove } = useSelect(
		( select ) => ( {
			canRemove: select( blockEditorStore ).canRemoveBlock( clientId ),
		} ),
		[ clientId ]
	);

	const { replaceBlocks } = useDispatch( blockEditorStore );

	const block = useSelect(
		( select ) => select( blockEditorStore ).getBlock( clientId ),
		[ clientId ]
	);

	const convertToBlocks = () => {
		replaceBlocks(
			block.clientId,
			rawHandler( { HTML: serialize( block ) } )
		);
	};

	const actions = [
		<Button
			__next40pxDefaultSize
			key="convert"
			onClick={ convertToBlocks }
			variant="primary"
		>
			{ __( 'Convert to blocks' ) }
		</Button>,
	];

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
			<div { ...useBlockProps( { className: 'has-warning' } ) }>
				<Warning actions={ actions }>
					{ __(
						'It appears you are using the deprecated Classic block. You can keep editing it for now, but it is recommended to convert it to blocks.'
					) }
				</Warning>
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
