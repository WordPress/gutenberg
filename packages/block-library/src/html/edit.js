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
} from '@wordpress/block-editor';
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
import Preview from './preview';
import HTMLEditModal from './modal';

export default function HTMLEdit( { attributes, setAttributes, isSelected } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const blockProps = useBlockProps( {
		className: 'block-library-html__edit',
	} );

	// Show placeholder when content is empty
	if ( ! attributes.content?.trim() ) {
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
				<HTMLEditModal
					isOpen={ isModalOpen }
					onRequestClose={ () => setIsModalOpen( false ) }
					content={ attributes.content }
					setAttributes={ setAttributes }
				/>
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
				<VStack
					className="block-editor-block-inspector-edit-contents"
					expanded
				>
					<Button
						className="block-editor-block-inspector-edit-contents__button"
						__next40pxDefaultSize
						variant="secondary"
						onClick={ () => setIsModalOpen( true ) }
					>
						{ __( 'Edit code' ) }
					</Button>
				</VStack>
			</InspectorControls>
			<Preview content={ attributes.content } isSelected={ isSelected } />
			<HTMLEditModal
				isOpen={ isModalOpen }
				onRequestClose={ () => setIsModalOpen( false ) }
				content={ attributes.content }
				setAttributes={ setAttributes }
			/>
		</div>
	);
}
