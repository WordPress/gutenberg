import {
	escapeEditableHTML,
	escapeAttribute,
	isValidAttributeName,
} from '@wordpress/escape-html';
import { toTree } from './to-tree';
import type { HTMLTreeNode, RichTextValue } from './types';

/**
 * Create an HTML string from a Rich Text value.
 *
 * @param options                      Named arguments.
 * @param options.value                Rich text value.
 * @param [options.preserveWhiteSpace] Preserves newlines if true.
 *
 * @return HTML string.
 */
export function toHTMLString( {
	value,
	preserveWhiteSpace,
}: {
	value: RichTextValue;
	preserveWhiteSpace?: boolean;
} ): string {
	const tree = toTree< HTMLTreeNode >( {
		value,
		preserveWhiteSpace,
		createEmpty,
		append,
		getLastChild,
		getParent,
		isText,
		getText,
		remove,
		appendText,
	} );

	return createChildrenHTML( tree.children );
}

/**
 * Creates the HTML of the editable tree of a value: the markup `toDom` builds
 * as nodes, with the editor-only attributes and the placeholder.
 *
 * @param $1             Named arguments.
 * @param $1.value       The value, with editor-only formats prepared.
 * @param $1.placeholder Placeholder text.
 *
 * @return The HTML.
 */
export function toEditableHTMLString( {
	value,
	placeholder,
}: {
	value: RichTextValue;
	placeholder?: string;
} ): string {
	const tree = toTree< HTMLTreeNode >( {
		value,
		createEmpty,
		append,
		getLastChild,
		getParent,
		isText,
		getText,
		remove,
		appendText,
		isEditableTree: true,
		placeholder,
	} );

	return createChildrenHTML( tree.children );
}

function createEmpty() {
	return {};
}

function getLastChild( { children }: HTMLTreeNode ) {
	return children && children[ children.length - 1 ];
}

function append( parent: HTMLTreeNode, object: string | HTMLTreeNode ) {
	if ( typeof object === 'string' ) {
		object = { text: object };
	}

	object.parent = parent;
	parent.children = parent.children || [];
	parent.children.push( object );
	return object;
}

function appendText( object: HTMLTreeNode, text: string ) {
	object.text += text;
}

function getParent( { parent }: HTMLTreeNode ) {
	return parent!;
}

function isText( { text }: HTMLTreeNode ) {
	return typeof text === 'string';
}

function getText( { text }: HTMLTreeNode ) {
	return text!;
}

function remove( object: HTMLTreeNode ) {
	const index = object.parent!.children!.indexOf( object );

	if ( index !== -1 ) {
		object.parent!.children!.splice( index, 1 );
	}

	return object;
}

function createElementHTML( {
	type,
	attributes,
	object,
	children,
}: HTMLTreeNode ) {
	if ( type === '#comment' ) {
		// We can't restore the original comment delimiters, because once parsed
		// into DOM nodes, we don't have the information. But in the future we
		// could allow comment handlers to specify custom delimiters, for
		// example `</{comment-content}>` for Bits, where `comment-content`
		// would be `/{bit-name}` or `__{translatable-string}` (TBD).
		return `<!--${ attributes![ 'data-rich-text-comment' ] }-->`;
	}

	let attributeString = '';

	for ( const key in attributes ) {
		if ( ! isValidAttributeName( key ) ) {
			continue;
		}

		// The editable tree marks some attributes with `true`, which
		// `setAttribute` turns into a string.
		attributeString += ` ${ key }="${ escapeAttribute(
			String( attributes[ key ] )
		) }"`;
	}

	if ( object ) {
		return `<${ type }${ attributeString }>`;
	}

	return `<${ type }${ attributeString }>${ createChildrenHTML(
		children
	) }</${ type }>`;
}

function createChildrenHTML( children: HTMLTreeNode[] = [] ): string {
	return children
		.map( ( child ) => {
			if ( child.html !== undefined ) {
				return child.html;
			}

			return child.text === undefined
				? createElementHTML( child )
				: escapeEditableHTML( child.text );
		} )
		.join( '' );
}
