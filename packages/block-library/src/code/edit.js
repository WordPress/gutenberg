/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { CodeCopyButton } from '@wordpress/components';

export default function CodeEdit( {
	attributes,
	setAttributes,
	onRemove,
	insertBlocksAfter,
	mergeBlocks,
} ) {
	const [ isWordWrapped, setIsWordWrapped ] = useState( false );
	const blockProps = useBlockProps( {
		style: {
			position: 'relative',
		},
	} );

	const preStyle = {
		whiteSpace: isWordWrapped ? 'pre-wrap' : 'pre',
		overflowX: isWordWrapped ? 'visible' : 'auto',
	};

	return (
		<div { ...blockProps }>
			<div
				style={ {
					position: 'absolute',
					top: '8px',
					right: '8px',
					zIndex: 1,
				} }
			>
				<CodeCopyButton
					text={ attributes.content || '' }
					onWordWrapToggle={ setIsWordWrapped }
					isWordWrapped={ isWordWrapped }
				/>
			</div>
			<pre style={ preStyle }>
				<RichText
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
		</div>
	);
}
