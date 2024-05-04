/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';
import { useDispatch, useSelect } from '@wordpress/data';
import { ENTER } from '@wordpress/keycodes';
import { create, split, toHTMLString } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { RichTextWrapper } from './';
import { store as blockEditorStore } from '../../store';
import { useBlockEditContext } from '../block-edit';
import { getMultilineTag } from './utils';

function RichTextMultiline(
	{
		children,
		identifier,
		tagName: TagName = 'div',
		value = '',
		onChange,
		multiline,
		...props
	},
	forwardedRef
) {
	deprecated( 'wp.blockEditor.RichText multiline prop', {
		since: '6.1',
		version: '6.3',
		alternative: 'nested blocks (InnerBlocks)',
		link: 'https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/nested-blocks-inner-blocks/',
	} );

	const { clientId } = useBlockEditContext();
	const { getSelectionStart, getSelectionEnd } =
		useSelect( blockEditorStore );
	const { selectionChange } = useDispatch( blockEditorStore );

	const multilineTagName = getMultilineTag( multiline );
	value = value || `<${ multilineTagName }></${ multilineTagName }>`;
	const padded = `</${ multilineTagName }>${ value }<${ multilineTagName }>`;
	const values = padded.split(
		`</${ multilineTagName }><${ multilineTagName }>`
	);

	values.shift();
	values.pop();

	function _onChange( newValues ) {
		onChange(
			`<${ multilineTagName }>${ newValues.join(
				`</${ multilineTagName }><${ multilineTagName }>`
			) }</${ multilineTagName }>`
		);
	}

	return (
		<TagName ref={ forwardedRef }>
			{ values.map( ( _value, index ) => {
				return (
					<RichTextWrapper
						key={ index }
						identifier={ `${ identifier }-${ index }` }
						tagName={ multilineTagName }
						value={ _value }
						onChange={ ( newValue ) => {
							const newValues = values.slice();
							newValues[ index ] = newValue;
							_onChange( newValues );
						} }
						isSelected={ undefined }
						onKeyDown={ ( event ) => {
							if ( event.keyCode !== ENTER ) {
								return;
							}

							event.preventDefault();

							const { offset: start } = getSelectionStart();
							const { offset: end } = getSelectionEnd();

							// Cannot split if there is no selection.
							if (
								typeof start !== 'number' ||
								typeof end !== 'number'
							) {
								return;
							}

							const richTextValue = create( { html: _value } );
							richTextValue.start = start;
							richTextValue.end = end;

							const array = split( richTextValue ).map( ( v ) =>
								toHTMLString( { value: v } )
							);

							const newValues = values.slice();
							newValues.splice( index, 1, ...array );
							_onChange( newValues );
							selectionChange(
								clientId,
								`${ identifier }-${ index + 1 }`,
								0,
								0
							);
						} }
						onMerge={ ( forward ) => {
							const newValues = values.slice();
							let offset = 0;
							if ( forward ) {
								if ( ! newValues[ index + 1 ] ) {
									return;
								}
								newValues.splice(
									index,
									2,
									newValues[ index ] + newValues[ index + 1 ]
								);
								offset = newValues[ index ].length - 1;
							} else {
								if ( ! newValues[ index - 1 ] ) {
									return;
								}
								newValues.splice(
									index - 1,
									2,
									newValues[ index - 1 ] + newValues[ index ]
								);
								offset = newValues[ index - 1 ].length - 1;
							}
							_onChange( newValues );
							selectionChange(
								clientId,
								`${ identifier }-${
									index - ( forward ? 0 : 1 )
								}`,
								offset,
								offset
							);
						} }
						{ ...props }
					/>
				);
			} ) }
		</TagName>
	);
}

export default forwardRef( RichTextMultiline );
