/**
 * WordPress dependencies
 */
import {
	Modal,
	SearchControl,
	Flex,
	FlexItem,
	Button,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import InserterListbox from '../../inserter-listbox';
import ImageResults from './image-results';
import useInsertionPoint from '../hooks/use-insertion-point';

const baseClassName = 'block-editor-image-explorer';

function ExplorerSidebar( { filterValue, setFilterValue } ) {
	return (
		<div className={ `${ baseClassName }__sidebar` }>
			<div className={ `${ baseClassName }__search` }>
				<SearchControl
					onChange={ setFilterValue }
					value={ filterValue }
					label={ __( 'Search for images' ) }
					placeholder={ __( 'Search' ) }
				/>
			</div>
			{ /* // TODO: add filters from Openverse */ }
		</div>
	);
}

function ExplorerContent( { filterValue, onModalClose } ) {
	const [ selectedImages, setSelectedImages ] = useState( [] );
	const selectImage = ( image ) => {
		setSelectedImages( [ ...selectedImages, image ] );
	};
	return (
		<div className={ `${ baseClassName }__content` }>
			<ExplorerSelectedImages
				selectedImages={ selectedImages }
				setSelectedImages={ setSelectedImages }
				onInsert={ onModalClose }
			/>
			<InserterListbox>
				<ImageResults
					search={ filterValue }
					pageSize={ 9 }
					onClick={ selectImage }
				/>
			</InserterListbox>
		</div>
	);
}

function ExplorerSelectedImages( {
	selectedImages,
	setSelectedImages,
	onInsert,
} ) {
	const [ , onInsertBlocks ] = useInsertionPoint( {
		shouldFocusBlock: true,
	} );
	const onInsertImages = () => {
		onInsertBlocks(
			selectedImages.map( ( image ) => {
				return createBlock( 'core/image', {
					url: image.url,
					alt: image.title,
				} );
			} )
		);
		onInsert();
	};
	const onInsertGallery = () => {
		onInsertBlocks(
			createBlock(
				'core/gallery',
				{},
				selectedImages.map( ( image ) =>
					createBlock( 'core/image', {
						url: image.url,
						alt: image.title,
					} )
				)
			)
		);
		onInsert();
	};
	if ( ! selectedImages.length ) {
		return (
			<div className={ `${ baseClassName }__selected-images` }>
				{ __( 'No images are selected' ) }
			</div>
		);
	}
	return (
		<div className={ `${ baseClassName }__selected-images` }>
			<h3>{ `${ selectedImages.length } selected` }</h3>
			<Flex justify="flex-start" align="center" gap="4">
				{ selectedImages.map( ( image ) => (
					<FlexItem key={ image.id }>
						<img src={ image.url } alt={ image.title } />
					</FlexItem>
				) ) }
			</Flex>
			<Flex
				justify="flex-end"
				align="center"
				gap="4"
				className={ `${ baseClassName }__selected-images__actions` }
			>
				<FlexItem>
					<Button
						variant="primary"
						onClick={ () => onInsertImages() }
						label={ __( 'Insert Images' ) }
					>
						{ __( 'Insert Images' ) }
					</Button>
				</FlexItem>
				<FlexItem>
					<Button
						variant="secondary"
						onClick={ () => onInsertGallery() }
						label={ __( 'Create Gallery' ) }
					>
						{ __( 'Create Gallery' ) }
					</Button>
				</FlexItem>
				<FlexItem>
					<Button
						onClick={ () => setSelectedImages( [] ) }
						label={ __( 'Remove Selection' ) }
					>
						{ __( 'Remove Selection' ) }
					</Button>
				</FlexItem>
			</Flex>
		</div>
	);
}

function ImageExplorer( { initialValue, onModalClose } ) {
	const [ filterValue, setFilterValue ] = useState( initialValue );
	return (
		<div className="block-editor-image-explorer">
			<ExplorerSidebar
				filterValue={ filterValue }
				setFilterValue={ setFilterValue }
			/>
			<ExplorerContent
				filterValue={ filterValue }
				onModalClose={ onModalClose }
			/>
		</div>
	);
}

function ImageExplorerModal( { onModalClose, ...restProps } ) {
	return (
		<Modal
			title={ __( 'External Images' ) }
			closeLabel={ __( 'Close' ) }
			onRequestClose={ onModalClose }
			isFullScreen
		>
			<ImageExplorer { ...restProps } onModalClose={ onModalClose } />
		</Modal>
	);
}

export default ImageExplorerModal;
