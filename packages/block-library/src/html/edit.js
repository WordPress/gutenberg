/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useContext, useState, useRef, useEffect } from '@wordpress/element';
import { BlockControls, useBlockProps } from '@wordpress/block-editor';
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

	const editorRef = useRef();

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

	useEffect( () => {
		( async () => {
			const { EditorView, basicSetup } = await import( 'codemirror' );
			const { html } = await import( '@codemirror/lang-html' );

			if ( editorRef.current ) {
				new EditorView( {
					doc: attributes.content,
					extensions: [
						basicSetup,
						html(),
						EditorView.updateListener.of( ( editor ) => {
							if ( editor.docChanged ) {
								setAttributes( {
									content: editor.state.doc.toString(),
								} );
							}
						} ),
					],
					parent: editorRef.current,
				} );
			}
		} )();
		// Run this only when the UI renders, so we can ignore the dependency array.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ isPreview, isDisabled ] );

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
				<div ref={ editorRef } aria-label={ __( 'HTML' ) } />
			) }
		</div>
	);
}
