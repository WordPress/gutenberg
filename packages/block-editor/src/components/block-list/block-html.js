/**
 * WordPress dependencies
 */
import { useEffect, useState, useRef } from '@wordpress/element';
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
	const editableElementRef = useRef( null );
	const block = useSelect(
		( select ) => select( blockEditorStore ).getBlock( clientId ),
		[ clientId ]
	);
	const { updateBlock } = useDispatch( blockEditorStore );

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
		const blockContent = getBlockContent( block );
		setHtml( blockContent );
		if ( editableElementRef.current ) {
			editableElementRef.current.textContent = blockContent;
		}
	}, [ block ] );

	const onInput = () => {
		if ( editableElementRef.current ) {
			setHtml( editableElementRef.current.textContent );
		}
	};

	return (
		<pre
			ref={ editableElementRef }
			className="block-editor-block-list__block-html-textarea"
			contentEditable="plaintext-only"
			suppressContentEditableWarning
			// eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
			role="textbox"
			onBlur={ onChange }
			onInput={ onInput }
			onPaste={ ( event ) => {
				event.stopPropagation();
				onInput();
			} }
		/>
	);
}

export default BlockHTML;
