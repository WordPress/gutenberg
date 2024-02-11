/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useContext } from '@wordpress/element';
import {
	BlockControls,
	PlainText,
	useBlockProps,
} from '@wordpress/block-editor';
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
	const isDisabled = useContext( Disabled.Context );
	const instanceId = useInstanceId( HTMLEdit, 'html-edit-desc' );
	const blockProps = useBlockProps( {
		className: 'block-library-html__edit',
		'aria-describedby': attributes.isPreview ? instanceId : undefined,
	} );

	return (
		<div { ...blockProps }>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						className="components-tab-button"
						isPressed={ ! attributes.isPreview }
						onClick={ () => setAttributes( { isPreview: false } ) }
					>
						{ __( 'Edit' ) }
					</ToolbarButton>
					<ToolbarButton
						className="components-tab-button"
						isPressed={ attributes.isPreview }
						onClick={ () => setAttributes( { isPreview: true } ) }
					>
						{ __( 'Preview' ) }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			{ attributes.isPreview || isDisabled ? (
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
				<PlainText
					value={ attributes.content }
					onChange={ ( content ) => setAttributes( { content } ) }
					placeholder={ __( 'Write HTML…' ) }
					aria-label={ __( 'HTML' ) }
				/>
			) }
		</div>
	);
}
