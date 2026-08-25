import { __ } from '@wordpress/i18n';
import { useState, useContext } from '@wordpress/element';
import {
	PlainText,
	useBlockProps,
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useInstanceId } from '@wordpress/compose';
import {
	Placeholder,
	ToolbarButton,
	ToolbarGroup,
	Disabled,
	VisuallyHidden,
} from '@wordpress/components';
import { shortcode } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import ServerSideRender from '@wordpress/server-side-render';

export default function ShortcodeEdit( { attributes, setAttributes } ) {
	const [ isPreview, setIsPreview ] = useState();
	const isDisabled = useContext( Disabled.Context );
	const instanceId = useInstanceId( ShortcodeEdit );
	const inputId = `blocks-shortcode-input-${ instanceId }`;

	const isPreviewMode = useSelect( ( select ) => {
		return select( blockEditorStore ).getSettings().isPreviewMode;
	}, [] );

	function switchToPreview() {
		setIsPreview( true );
	}

	function switchToHTML() {
		setIsPreview( false );
	}

	const blockProps = useBlockProps( {
		className: 'block-library-shortcode__edit',
		'aria-describedby': isPreview ? `${ instanceId }-desc` : undefined,
	} );

	return (
		<div { ...blockProps }>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						isPressed={ ! isPreview }
						onClick={ switchToHTML }
					>
						{ __( 'Edit' ) }
					</ToolbarButton>
					<ToolbarButton
						isPressed={ isPreview }
						onClick={ switchToPreview }
					>
						{ __( 'Preview' ) }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			{ isPreview || isPreviewMode || isDisabled ? (
				<>
					<ServerSideRender
						block="core/shortcode"
						attributes={ attributes }
					/>
					<VisuallyHidden id={ `${ instanceId }-desc` }>
						{ __(
							'Shortcode preview is not yet fully accessible. Please switch screen reader to virtualized mode to navigate the below content.'
						) }
					</VisuallyHidden>
				</>
			) : (
				<Placeholder icon={ shortcode } label={ __( 'Shortcode' ) }>
					<PlainText
						className="blocks-shortcode__textarea"
						id={ inputId }
						value={ attributes.text }
						aria-label={ __( 'Shortcode text' ) }
						placeholder={ __( 'Write shortcode here…' ) }
						onChange={ ( text ) => setAttributes( { text } ) }
					/>
				</Placeholder>
			) }
		</div>
	);
}
