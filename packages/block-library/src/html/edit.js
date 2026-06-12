/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	BlockControls,
	BlockIcon,
	InspectorControls,
	useBlockProps,
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { parse, serialize, getBlockContent } from '@wordpress/blocks';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import {
	ToolbarButton,
	ToolbarGroup,
	Placeholder,
	Button,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { code } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import HTMLEditModal from './modal';

const { InnerContent } = unlock( blockEditorPrivateApis );

export default function HTMLEdit( { clientId } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const registry = useRegistry();
	const { updateBlock, replaceInnerBlocks } = useDispatch( blockEditorStore );
	const content = useSelect(
		( select ) => {
			const block = select( blockEditorStore ).getBlock( clientId );
			return block ? getBlockContent( block ) : '';
		},
		[ clientId ]
	);
	const blockProps = useBlockProps( {
		className: 'block-library-html__edit',
	} );

	// Re-parse the edited content: static HTML becomes the block's
	// `innerContent` fragments and `<!-- wp:* -->` delimited segments become
	// inner blocks mounted at their positions within the static markup.
	const onUpdate = ( nextContent ) => {
		if ( nextContent === content ) {
			return;
		}

		const [ parsedBlock ] = parse(
			`<!-- wp:html -->\n${ nextContent }\n<!-- /wp:html -->`
		);
		const nextInnerBlocks = parsedBlock?.innerBlocks ?? [];
		const prevInnerBlocks = registry
			.select( blockEditorStore )
			.getBlocks( clientId );
		// Keep the existing inner blocks, and thereby their client IDs and
		// selection, when their markup is unchanged — e.g. when only the
		// surrounding static HTML was edited.
		const innerBlocksUnchanged =
			prevInnerBlocks.length === nextInnerBlocks.length &&
			prevInnerBlocks.every(
				( block, index ) =>
					serialize( block ) === serialize( nextInnerBlocks[ index ] )
			);

		registry.batch( () => {
			updateBlock( clientId, {
				innerContent:
					parsedBlock?.innerContent ??
					( nextContent ? [ nextContent ] : [] ),
			} );
			if ( ! innerBlocksUnchanged ) {
				replaceInnerBlocks( clientId, nextInnerBlocks, false );
			}
		} );
	};

	// Show placeholder when content is empty
	if ( ! content?.trim() ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					icon={ <BlockIcon icon={ code } /> }
					label={ __( 'Custom HTML' ) }
					instructions={ __(
						'Add custom HTML code and preview how it looks.'
					) }
				>
					<Button
						__next40pxDefaultSize
						variant="primary"
						onClick={ () => setIsModalOpen( true ) }
					>
						{ __( 'Edit HTML' ) }
					</Button>
				</Placeholder>
				{ isModalOpen && (
					<HTMLEditModal
						onRequestClose={ () => setIsModalOpen( false ) }
						content={ content }
						onUpdate={ onUpdate }
					/>
				) }
			</div>
		);
	}

	return (
		<div { ...blockProps }>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton onClick={ () => setIsModalOpen( true ) }>
						{ __( 'Edit code' ) }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls>
				<VStack className="block-library-html__edit-code" expanded>
					<Button
						className="block-library-html__edit-code-button"
						__next40pxDefaultSize
						variant="secondary"
						onClick={ () => setIsModalOpen( true ) }
					>
						{ __( 'Edit code' ) }
					</Button>
				</VStack>
			</InspectorControls>
			<InnerContent clientId={ clientId } />
			{ isModalOpen && (
				<HTMLEditModal
					onRequestClose={ () => setIsModalOpen( false ) }
					content={ content }
					onUpdate={ onUpdate }
				/>
			) }
		</div>
	);
}
