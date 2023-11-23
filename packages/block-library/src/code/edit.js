/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import { useRefEffect } from '@wordpress/compose';
import { TAB } from '@wordpress/keycodes';

export default function CodeEdit( {
	attributes,
	setAttributes,
	onRemove,
	insertBlocksAfter,
	mergeBlocks,
} ) {
	const blockProps = useBlockProps();
	const ref = useRefEffect( ( element ) => {
		function onKeyDown( event ) {
			const { keyCode, shiftKey, altKey, metaKey, ctrlKey } = event;

			if (
				event.defaultPrevented ||
				keyCode !== TAB ||
				// Only override when no modifiers are pressed.
				shiftKey ||
				altKey ||
				metaKey ||
				ctrlKey
			) {
				return;
			}

			event.preventDefault();
			element.ownerDocument.execCommand( 'insertText', false, '\t' );
		}
		element.addEventListener( 'keydown', onKeyDown );
		return () => {
			element.removeEventListener( 'keydown', onKeyDown );
		};
	}, [] );
	return (
		<pre { ...blockProps }>
			<RichText
				ref={ ref }
				tagName="code"
				identifier="content"
				value={ attributes.content }
				onChange={ ( content ) => setAttributes( { content } ) }
				onRemove={ onRemove }
				onMerge={ mergeBlocks }
				placeholder={ __( 'Write code…' ) }
				aria-label={ __( 'Code' ) }
				preserveWhiteSpace
				__unstablePastePlainText
				__unstableOnSplitAtDoubleLineEnd={ () =>
					insertBlocksAfter( createBlock( getDefaultBlockName() ) )
				}
			/>
		</pre>
	);
}
