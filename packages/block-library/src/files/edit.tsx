import { __ } from '@wordpress/i18n';
import {
	BlockControls,
	BlockIcon,
	JustifyContentControl,
	MediaPlaceholder,
	MediaUpload,
	MediaUploadCheck,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
	// @ts-expect-error `@wordpress/block-editor` does not expose type declarations for its entry point.
} from '@wordpress/block-editor';
import type { Block } from '@wordpress/blocks';
import { ToolbarButton } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { file as icon } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import {
	createFileBlocks,
	type MediaItem,
} from '../file/utils/create-file-blocks';

const ALLOWED_BLOCKS = [ 'core/file' ];
const JUSTIFY_CONTROLS = [ 'left', 'center', 'right', 'space-between' ];

type FileBlockAttributes = {
	layout?: {
		justifyContent?: string;
		[ key: string ]: unknown;
	};
};

type FilesEditProps = {
	clientId: string;
};

export default function FilesEdit( { clientId }: FilesEditProps ) {
	const fileBlocks: Block< FileBlockAttributes >[] = useSelect(
		( select ) => select( blockEditorStore ).getBlocks( clientId ),
		[ clientId ]
	);
	const { insertBlocks, replaceInnerBlocks, updateBlockAttributes } =
		useDispatch( blockEditorStore );
	const { createErrorNotice } = useDispatch( noticesStore );

	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
	} );

	function onUploadError( message: string ) {
		createErrorNotice( message, { type: 'snackbar' } );
	}

	function onSelectFiles( selection: ArrayLike< File | MediaItem > ) {
		replaceInnerBlocks( clientId, createFileBlocks( selection ) );
	}

	function onAddFiles( selection: MediaItem[] ) {
		insertBlocks(
			createFileBlocks( selection ),
			fileBlocks.length,
			clientId
		);
	}

	// Every row shares one justification, so the first file's value stands
	// for all of them.
	const justifyContent = fileBlocks[ 0 ]?.attributes.layout?.justifyContent;

	function onChangeJustifyContent( nextJustifyContent?: string ) {
		const attributesByClientId = Object.fromEntries(
			fileBlocks.map( ( { clientId: fileClientId, attributes } ) => [
				fileClientId,
				{
					layout: {
						type: 'flex',
						...attributes.layout,
						justifyContent: nextJustifyContent,
					},
				},
			] )
		);
		updateBlockAttributes(
			Object.keys( attributesByClientId ),
			attributesByClientId,
			{ uniqueByBlock: true }
		);
	}

	if ( ! fileBlocks.length ) {
		return (
			<div { ...blockProps }>
				<MediaPlaceholder
					icon={ <BlockIcon icon={ icon } /> }
					labels={ {
						title: __( 'Files' ),
						instructions: __(
							'Drag and drop files, upload, or choose from your library.'
						),
					} }
					onSelect={ onSelectFiles }
					onError={ onUploadError }
					accept="*"
					multiple
					// Each File block uploads its own file, so the upload
					// progress shows on its row.
					handleUpload={ false }
				/>
			</div>
		);
	}

	return (
		<>
			<BlockControls group="block">
				<JustifyContentControl
					allowedControls={ JUSTIFY_CONTROLS }
					value={ justifyContent }
					onChange={ onChangeJustifyContent }
				/>
			</BlockControls>
			<BlockControls group="other">
				<MediaUploadCheck>
					<MediaUpload
						multiple
						onSelect={ onAddFiles }
						render={ ( { open }: { open: () => void } ) => (
							<ToolbarButton onClick={ open }>
								{ __( 'Add files' ) }
							</ToolbarButton>
						) }
					/>
				</MediaUploadCheck>
			</BlockControls>
			<div { ...innerBlocksProps } />
		</>
	);
}
