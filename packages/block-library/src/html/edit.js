/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useMemo } from '@wordpress/element';
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
import { code, seen, unseen } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Preview from './preview';
import HTMLEditModal from './modal';

function hasVisibleContent( html ) {
	if ( ! html?.trim() ) {
		return false;
	}
	const doc = new window.DOMParser().parseFromString( html, 'text/html' );
	[ 'script', 'style', 'meta', 'link', 'noscript', 'template' ].forEach(
		( tag ) => doc.querySelectorAll( tag ).forEach( ( el ) => el.remove() )
	);
	return doc.body.innerHTML.trim().length > 0;
}

export default function HTMLEdit( { attributes, setAttributes, isSelected } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ isPreviewDisabled, setIsPreviewDisabled ] = useState( false );

	const blockProps = useBlockProps( {
		className: 'block-library-html__edit',
	} );

	const containsVisibleContent = useMemo( () => {
		return hasVisibleContent( attributes.content );
	}, [ attributes.content ] );

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
					<ToolbarButton
						icon={ isPreviewDisabled ? unseen : seen }
						label={
							isPreviewDisabled
								? __( 'Enable preview' )
								: __( 'Disable preview' )
						}
						isPressed={ isPreviewDisabled }
						onClick={ () => setIsPreviewDisabled( ( v ) => ! v ) }
					/>
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
			{ isPreviewDisabled || ! containsVisibleContent ? (
				<Placeholder
					icon={ <BlockIcon icon={ code } /> }
					label={ __( 'Custom HTML' ) }
					instructions={
						isPreviewDisabled
							? __( 'Preview is disabled.' )
							: __( 'This code has no visual preview.' )
					}
				/>
			) : (
				<Preview
					content={ attributes.content }
					isSelected={ isSelected }
				/>
			) }
			<HTMLEditModal
				isOpen={ isModalOpen }
				onRequestClose={ () => setIsModalOpen( false ) }
				content={ attributes.content }
				setAttributes={ setAttributes }
			/>
		</div>
	);
}
