/**
 * External dependencies
 */
import TextareaAutosize from 'react-autosize-textarea';

/**
 * WordPress dependencies
 */
import { useEffect, useMemo, useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	getBlockAttributes,
	getBlockContent,
	getBlockType,
	getSaveContent,
	validateBlock,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

function BlockHTML( { clientId } ) {
	const [ html, setHtml ] = useState( '' );
	const block = useSelect(
		( select ) => select( blockEditorStore ).getBlock( clientId ),
		[ clientId ]
	);
	const { updateBlock } = useDispatch( blockEditorStore );

	// Derive block content as a primitive string so the effect only fires
	// when the serialized content genuinely changes, not when the block
	// object reference changes (which happens on every RESET_BLOCKS during
	// RTC sync, even for unchanged blocks).
	const blockContent = useMemo(
		() => ( block ? getBlockContent( block ) : '' ),
		[ block ]
	);

	const onChange = () => {
		const blockType = getBlockType( block.name );

		if ( ! blockType ) {
			return;
		}

		const attributes = getBlockAttributes(
			blockType,
			html,
			block.attributes
		);

		// If html is empty  we reset the block to the default HTML and mark it as valid to avoid triggering an error
		const content = html ? html : getSaveContent( blockType, attributes );
		const [ isValid ] = html
			? validateBlock( {
					...block,
					attributes,
					originalContent: content,
			  } )
			: [ true ];

		updateBlock( clientId, {
			attributes,
			originalContent: content,
			isValid,
		} );

		// Ensure the state is updated if we reset so it displays the default content.
		if ( ! html ) {
			setHtml( content );
		}
	};

	useEffect( () => {
		setHtml( blockContent );
	}, [ blockContent ] );

	return (
		<TextareaAutosize
			className="block-editor-block-list__block-html-textarea"
			value={ html }
			onBlur={ onChange }
			onChange={ ( event ) => setHtml( event.target.value ) }
		/>
	);
}

export default BlockHTML;
