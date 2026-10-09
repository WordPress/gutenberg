import { toTree } from './to-tree';
import { createElement } from './create-element';
import { isRangeEqual } from './is-range-equal';
import type {
	RichTextFormatList,
	RichTextValue,
	ToDomSelection,
	ToTreeOptions,
	TreeElement,
	TreeHTML,
} from './types';

/**
 * MathML namespace URI.
 *
 * @see https://www.w3.org/1998/Math/MathML/
 */
const MATHML_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';

/**
 * Creates a path as an array of indices from the given root node to the given
 * node.
 *
 * @param node     Node to find the path of.
 * @param rootNode Root node to find the path from.
 * @param path     Initial path to build on.
 *
 * @return The path from the root node to the node.
 */
function createPathToNode( node: Node | null, rootNode: Node, path: number[] ) {
	const parentNode = node!.parentNode;
	let i = 0;

	while ( ( node = node!.previousSibling ) ) {
		i++;
	}

	path = [ i, ...path ];

	if ( parentNode !== rootNode ) {
		path = createPathToNode( parentNode, rootNode, path );
	}

	return path;
}

/**
 * Gets a node given a path (array of indices) from the given node.
 *
 * @param node Root node to find the wanted node in.
 * @param path Path (indices) to the wanted node.
 *
 * @return Object with the found node and the remaining offset (if any).
 */
function getNodeByPath( node: Node, path: number[] ) {
	path = [ ...path ];

	while ( node && path.length > 1 ) {
		node = node.childNodes[ path.shift()! ];
	}

	return {
		node,
		offset: path[ 0 ],
	};
}

function append( element: Element, child: TreeHTML ): string;
function append( element: Element, child: string | TreeElement ): Node;
function append(
	element: Element,
	child: string | TreeElement | TreeHTML | Node
) {
	if ( ( child as TreeHTML ).html !== undefined ) {
		return ( element.innerHTML += ( child as TreeHTML ).html );
	}

	if ( typeof child === 'string' ) {
		child = element.ownerDocument.createTextNode( child );
	}

	const { type, attributes } = child as TreeElement;

	if ( type ) {
		if ( type === '#comment' ) {
			child = element.ownerDocument.createComment(
				attributes![ 'data-rich-text-comment' ] as string
			);
		} else {
			// Handle namespace-aware element creation
			const parentNamespace = element.namespaceURI;

			if ( type === 'math' ) {
				// Root math element always uses MathML namespace
				child = element.ownerDocument.createElementNS(
					MATHML_NAMESPACE,
					type
				);
			} else if ( parentNamespace === MATHML_NAMESPACE ) {
				if ( element.tagName === 'MTEXT' ) {
					// mtext switches back to HTML namespace for phrasing content
					child = element.ownerDocument.createElement( type );
				} else {
					// All other elements in MathML context use MathML namespace
					child = element.ownerDocument.createElementNS(
						MATHML_NAMESPACE,
						type
					);
				}
			} else {
				// Default HTML element creation
				child = element.ownerDocument.createElement( type );
			}

			for ( const key in attributes ) {
				( child as Element ).setAttribute(
					key,
					attributes[ key ] as string
				);
			}
		}
	}

	return element.appendChild( child as Node );
}

function appendText( node: Text, text: string ) {
	node.appendData( text );
}

function getLastChild( { lastChild }: Node ) {
	return lastChild!;
}

function getParent( { parentNode }: Node ) {
	return parentNode!;
}

function isText( node: Node ) {
	return node.nodeType === node.TEXT_NODE;
}

function getText( { nodeValue }: Node ) {
	return nodeValue!;
}

function remove( node: Node ) {
	return node.parentNode!.removeChild( node );
}

export function toDom( {
	value,
	prepareEditableTree,
	isEditableTree = true,
	placeholder,
	doc = document,
}: {
	value: RichTextValue;
	prepareEditableTree?: ( value: RichTextValue ) => RichTextFormatList[];
	isEditableTree?: boolean;
	placeholder?: string;
	doc?: Document;
} ) {
	let startPath: number[] = [];
	let endPath: number[] = [];

	if ( prepareEditableTree ) {
		value = {
			...value,
			formats: prepareEditableTree( value ),
		};
	}

	/**
	 * Returns a new instance of a DOM tree upon which RichText operations can be
	 * applied.
	 *
	 * Note: The current implementation will return a shared reference, reset on
	 * each call to `createEmpty`. Therefore, you should not hold a reference to
	 * the value to operate upon asynchronously, as it may have unexpected results.
	 *
	 * @return RichText tree.
	 */
	const createEmpty = () => createElement( doc, '' );

	const tree = toTree< Node >( {
		value,
		createEmpty,
		// `toTree` only appends to elements, and appends text to text nodes.
		append: append as ToTreeOptions< Node >[ 'append' ],
		getLastChild,
		getParent,
		isText,
		getText,
		remove,
		appendText: appendText as ToTreeOptions< Node >[ 'appendText' ],
		onStartIndex( body, pointer ) {
			startPath = createPathToNode( pointer, body, [
				pointer.nodeValue!.length,
			] );
		},
		onEndIndex( body, pointer ) {
			endPath = createPathToNode( pointer, body, [
				pointer.nodeValue!.length,
			] );
		},
		isEditableTree,
		placeholder,
	} );

	return {
		body: tree,
		selection: { startPath, endPath },
	};
}

/**
 * Create an `Element` tree from a Rich Text value and applies the difference to
 * the `Element` tree contained by `current`.
 *
 * @param options                       Named arguments.
 * @param options.value                 Value to apply.
 * @param options.current               The live root node to apply the element tree to.
 * @param [options.prepareEditableTree] Function to filter editorable formats.
 * @param [options.__unstableDomOnly]   Only apply elements, no selection.
 * @param [options.placeholder]         Placeholder text.
 */
export function apply( {
	value,
	current,
	prepareEditableTree,
	__unstableDomOnly,
	placeholder,
}: {
	value: RichTextValue;
	current: HTMLElement;
	prepareEditableTree?: ( value: RichTextValue ) => RichTextFormatList[];
	__unstableDomOnly?: boolean;
	placeholder?: string;
} ) {
	// Construct a new element tree in memory.
	const { body, selection } = toDom( {
		value,
		prepareEditableTree,
		placeholder,
		doc: current.ownerDocument,
	} );

	applyValue( body, current );

	if ( value.start !== undefined && ! __unstableDomOnly ) {
		applySelection( selection, current );
	}
}

export function applyValue( future: Node, current: Node ) {
	let i = 0;
	let futureChild;

	while ( ( futureChild = future.firstChild ) ) {
		const currentChild = current.childNodes[ i ];

		if ( ! currentChild ) {
			current.appendChild( futureChild );
		} else if ( ! currentChild.isEqualNode( futureChild ) ) {
			if (
				currentChild.nodeName !== futureChild.nodeName ||
				( currentChild.nodeType === currentChild.TEXT_NODE &&
					( currentChild as Text ).data !==
						( futureChild as Text ).data )
			) {
				current.replaceChild( futureChild, currentChild );
			} else {
				const currentAttributes = ( currentChild as Element )
					.attributes;
				const futureAttributes = ( futureChild as Element ).attributes;

				if ( currentAttributes ) {
					let ii = currentAttributes.length;

					// Reverse loop because `removeAttribute` on `currentChild`
					// changes `currentAttributes`.
					while ( ii-- ) {
						const { name } = currentAttributes[ ii ];

						if (
							! ( futureChild as Element ).getAttribute( name )
						) {
							( currentChild as Element ).removeAttribute( name );
						}
					}
				}

				if ( futureAttributes ) {
					for ( let ii = 0; ii < futureAttributes.length; ii++ ) {
						const { name, value } = futureAttributes[ ii ];

						if (
							( currentChild as Element ).getAttribute( name ) !==
							value
						) {
							( currentChild as Element ).setAttribute(
								name,
								value
							);
						}
					}
				}

				applyValue( futureChild, currentChild );
				future.removeChild( futureChild );
			}
		} else {
			future.removeChild( futureChild );
		}

		i++;
	}

	while ( current.childNodes[ i ] ) {
		current.removeChild( current.childNodes[ i ] );
	}
}

export function applySelection(
	{ startPath, endPath }: ToDomSelection,
	current: HTMLElement
) {
	const { node: startContainer, offset: startOffset } = getNodeByPath(
		current,
		startPath
	);
	const { node: endContainer, offset: endOffset } = getNodeByPath(
		current,
		endPath
	);
	const { ownerDocument } = current;
	const { defaultView } = ownerDocument;
	const selection = defaultView!.getSelection()!;
	const range = ownerDocument.createRange();

	range.setStart( startContainer, startOffset );
	range.setEnd( endContainer, endOffset );

	const { activeElement } = ownerDocument;

	if ( selection.rangeCount > 0 ) {
		// If the to be added range and the live range are the same, there's no
		// need to remove the live range and add the equivalent range.
		if ( isRangeEqual( range, selection.getRangeAt( 0 ) ) ) {
			return;
		}

		selection.removeAllRanges();
	}

	selection.addRange( range );

	// This function is not intended to cause a shift in focus. Since the above
	// selection manipulations may shift focus, ensure that focus is restored to
	// its previous state.
	if ( activeElement !== ownerDocument.activeElement ) {
		// The `instanceof` checks protect against edge cases where the focused
		// element is not of the interface HTMLElement (does not have a `focus`
		// or `blur` property).
		//
		// See: https://github.com/Microsoft/TypeScript/issues/5901#issuecomment-431649653
		if ( activeElement instanceof defaultView!.HTMLElement ) {
			activeElement.focus();
		}
	}
}
