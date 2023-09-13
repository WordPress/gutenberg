/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useContext, useEffect, useRef, useState } from '@wordpress/element';
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
	const [ isPreview, setIsPreview ] = useState();
	const [ shouldFocus, setShouldFocus ] = useState( false );
	const isDisabled = useContext( Disabled.Context );

	const htmlTextareaRef = useRef();
	const blockRef = useRef();

	const instanceId = useInstanceId( HTMLEdit );
	const instanceIdDesc = sprintf( 'html-edit-%d-desc', instanceId );

	function switchToPreview() {
		setIsPreview( true );
		setShouldFocus( true );
	}

	function switchToHTML() {
		setIsPreview( false );
		setShouldFocus( true );
	}

	// Effect for managing focus.
	useEffect( () => {
		if ( ! shouldFocus ) {
			return;
		}
		if ( isPreview ) {
			blockRef?.current?.focus();
		} else {
			htmlTextareaRef?.current?.focus();
		}
	}, [ shouldFocus, isPreview ] );

	const blockProps = useBlockProps( {
		className: 'block-library-html__edit',
		'aria-describedby': isPreview ? instanceIdDesc : undefined,
		ref: blockRef,
	} );

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
					<VisuallyHidden id={ instanceIdDesc }>
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
					ref={ htmlTextareaRef }
				/>
			) }
		</div>
	);
}
