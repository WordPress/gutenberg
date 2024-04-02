/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useContext, useState } from '@wordpress/element';
import { BlockControls, useBlockProps, EditorView } from '@wordpress/block-editor';
import {
	ToolbarButton,
	Disabled,
	ToolbarGroup,
	VisuallyHidden,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Preview from './preview';

export default function HTMLEdit( { attributes, setAttributes, isSelected } ) {
	const [ isPreview, setIsPreview ] = useState();
	const isDisabled = useContext( Disabled.Context );

	const instanceId = useInstanceId( HTMLEdit, 'html-edit-desc' );

	function switchToPreview() {
		setIsPreview( true );
	}

	function switchToHTML() {
		setIsPreview( false );
	}

	const blockProps = useBlockProps( {
		className: 'block-library-html__edit',
		'aria-describedby': isPreview ? instanceId : undefined,
	} );

	function onChange( newContent ) {
		setAttributes( { content: newContent } );
	}

	return (
		<div { ...blockProps }>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						className="components-tab-button"
						isPressed={ ! isPreview }
						onClick={ switchToHTML }
					>
						HTML
					</ToolbarButton>
					<ToolbarButton
						className="components-tab-button"
						isPressed={ isPreview }
						onClick={ switchToPreview }
					>
						{ __( 'Preview' ) }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			{ isPreview || isDisabled ? (
				<>
					<Preview
						content={ attributes.content }
						isSelected={ isSelected }
					/>
					<VisuallyHidden id={ instanceId }>
						{ __(
							'HTML preview is not yet fully accessible. Please switch screen reader to virtualized mode to navigate the below iFrame.'
						) }
					</VisuallyHidden>
				</>
			) : (
				<EditorView
					editorId={'block-library-html__editor'}
					editorInstructionsText={__(
						`This editor allows you to input your custom HTML.`
					)}
					initialConfig={{
						content: attributes.content,
						onChange,
						mode: 'html',
					}}
				/>
			) }
		</div>
	);
}
