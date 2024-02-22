/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, useEffect, useCallback } from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import {
	BlockControls,
	__experimentalGetElementClassName,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { ToolbarButton } from '@wordpress/components';
import { caption as captionIcon } from '@wordpress/icons';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { PrivateRichText: RichText } = unlock( blockEditorPrivateApis );

export function Caption( {
	key = 'caption',
	attributes,
	setAttributes,
	isSelected,
	insertBlocksAfter,
	placeholder = __( 'Add caption' ),
	label = __( 'Caption text' ),
	showToolbarButton = true,
	className,
	disableEditing,
} ) {
	const caption = attributes[ key ];
	const prevCaption = usePrevious( caption );
	const isCaptionEmpty = RichText.isEmpty( caption );
	const isPrevCaptionEmpty = RichText.isEmpty( prevCaption );
	const [ showCaption, setShowCaption ] = useState( ! isCaptionEmpty );

	// We need to show the caption when changes come from
	// history navigation(undo/redo).
	useEffect( () => {
		if ( ! isCaptionEmpty && isPrevCaptionEmpty ) {
			setShowCaption( true );
		}
	}, [ isCaptionEmpty, isPrevCaptionEmpty ] );

	useEffect( () => {
		if ( ! isSelected && isCaptionEmpty ) {
			setShowCaption( false );
		}
	}, [ isSelected, isCaptionEmpty ] );

	// Focus the caption when we click to add one.
	const ref = useCallback(
		( node ) => {
			if ( node && isCaptionEmpty ) {
				node.focus();
			}
		},
		[ isCaptionEmpty ]
	);
	return (
		<>
			{ showToolbarButton && (
				<BlockControls group="block">
					<ToolbarButton
						onClick={ () => {
							setShowCaption( ! showCaption );
							if ( showCaption && caption ) {
								setAttributes( { caption: undefined } );
							}
						} }
						icon={ captionIcon }
						isPressed={ showCaption }
						label={
							showCaption
								? __( 'Remove caption' )
								: __( 'Add caption' )
						}
					/>
				</BlockControls>
			) }
			{ showCaption &&
				( ! RichText.isEmpty( caption ) || isSelected ) && (
					<RichText
						identifier={ key }
						tagName="figcaption"
						className={ classnames(
							className,
							__experimentalGetElementClassName( 'caption' )
						) }
						ref={ ref }
						aria-label={ label }
						placeholder={ placeholder }
						value={ caption }
						onChange={ ( value ) =>
							setAttributes( { caption: value } )
						}
						inlineToolbar
						__unstableOnSplitAtEnd={ () =>
							insertBlocksAfter(
								createBlock( getDefaultBlockName() )
							)
						}
						disableEditing={ disableEditing }
					/>
				) }
		</>
	);
}
