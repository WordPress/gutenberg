/**
 * External dependencies
 */
import escapeStringRegexp from 'escape-string-regexp';
import classnames from 'classnames';
import { find, filter, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, findDOMNode, renderToString } from '@wordpress/element';
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './style.scss';
import Button from '../button';
import Popover from '../popover';
import withInstanceId from '../higher-order/with-instance-id';

const { ENTER, ESCAPE, UP, DOWN, LEFT, RIGHT, TAB } = keycodes;

/**
 * Recursively select the firstChild until hitting a leaf node.
 * @param {Node} node the node to find the recursive first child.
 * @returns {Node} the first leaf-node >= node in the ordering.
 */
function descendFirst( node ) {
	let n = node;
	while ( n.firstChild ) {
		n = n.firstChild;
	}
	return n;
}

/**
 * Recursively select the lastChild until hitting a leaf node.
 * @param {Node} node the node to find the recursive last child.
 * @returns {Node} the first leaf-node <= node in the ordering.
 */
function descendLast( node ) {
	let n = node;
	while ( n.lastChild ) {
		n = n.lastChild;
	}
	return n;
}

/**
 * Is the node a text node.
 * @param {?Node} node the node to check.
 * @returns {boolean} true if the node is a text node.
 */
function isTextNode( node ) {
	return node !== null && node.nodeType === 3;
}

/**
 * Return the node only if it is a text node, otherwise return null.
 * @param {?Node} node the node to filter.
 * @returns {?Node} the node or null if it is not a text node.
 */
function onlyTextNode( node ) {
	return isTextNode( node ) ? node : null;
}

/**
 * Find the index of the last charater in the text that is whitespace.
 * @param {String} text the text to search.
 * @returns {Number} the last index of a white space character in the text or -1.
 */
function lastIndexOfSpace( text ) {
	for ( let i = text.length - 1; i >= 0; i-- ) {
		if ( /\s/.test( text.charAt( i ) ) ) {
			return i;
		}
	}
	return -1;
}

export class Autocomplete extends Component {
	static getInitialState() {
		return {
			search: /./,
			selectedIndex: 0,
			open: undefined,
			query: undefined,
			range: undefined,
		};
	}

	constructor() {
		super( ...arguments );

		this.bindNode = this.bindNode.bind( this );
		this.select = this.select.bind( this );
		this.reset = this.reset.bind( this );
		this.search = this.search.bind( this );
		this.setSelectedIndex = this.setSelectedIndex.bind( this );

		this.state = this.constructor.getInitialState();
	}

	bindNode( node ) {
		this.node = node;
	}

	replace( range, replacement ) {
		const container = document.createElement( 'div' );
		container.innerHTML = renderToString( replacement );
		while ( container.firstChild ) {
			const child = container.firstChild;
			container.removeChild( child );
			range.insertNode( child );
			range.setStartAfter( child );
		}
		range.deleteContents();
	}

	select( option ) {
		const { open, range, query } = this.state;
		const { onSelect } = open || {};

		this.reset();

		if ( onSelect ) {
			const replacement = onSelect( option.value, range, query );
			if ( replacement !== undefined ) {
				this.replace( range, replacement );
			}
		}
	}

	reset() {
		this.setState( this.constructor.getInitialState() );
	}

	// this method is separate so it can be overrided in tests
	getCursor( container ) {
		const selection = window.getSelection();
		if ( selection.isCollapsed ) {
			if ( 'production' !== process.env.NODE_ENV ) {
				if ( ! container.contains( selection.anchorNode ) ) {
					throw new Error( 'Invalid assumption: expected selection to be within the autocomplete container' );
				}
			}
			return {
				node: selection.anchorNode,
				offset: selection.anchorOffset,
			};
		}
		return null;
	}

	// this method is separate so it can be overrided in tests
	createRange( startNode, startOffset, endNode, endOffset ) {
		const range = document.createRange();
		range.setStart( startNode, startOffset );
		range.setEnd( endNode, endOffset );
		return range;
	}

	loadOptions( index ) {
		this.props.completers[ index ].getOptions().then( ( options ) => {
			this.setState( {
				[ 'options_' + index ]: map( options,
					( option, i ) => ( { ...option, key: index + '_' + i } ) ),
			} );
		} );
	}

	findMatch( container, cursor, allCompleters, wasOpen ) {
		const allowAnything = () => true;
		let endTextNode;
		let endIndex;
		// search backwards to find the first preceeding space or non-text node.
		if ( isTextNode( cursor.node ) ) { // TEXT node
			endTextNode = cursor.node;
			endIndex = cursor.offset;
		} else if ( cursor.offset === 0 ) {
			endTextNode = onlyTextNode( descendFirst( cursor.node ) );
			endIndex = 0;
		} else {
			endTextNode = onlyTextNode( descendLast( cursor.node.childNodes[ cursor.offset - 1 ] ) );
			endIndex = endTextNode ? endTextNode.nodeValue.length : 0;
		}
		if ( endTextNode === null ) {
			return null;
		}
		// store the index of a completer in the object so we can use it to reference the options
		let completers = map( allCompleters, ( completer, idx ) => ( { ...completer, idx } ) );
		if ( wasOpen ) {
			// put the open completer at the start so it has priority
			completers = [
				wasOpen,
				...filter( completers, ( completer ) => completer.idx !== wasOpen.idx ),
			];
		}
		// filter the completers to those that could handle this node
		completers = filter( completers,
			( { allowNode = allowAnything } ) => allowNode( endTextNode, container ) );
		// exit early if nothing can handle it
		if ( completers.length === 0 ) {
			return null;
		}
		let startTextNode = endTextNode;
		let text = endTextNode.nodeValue.substring( 0, endIndex );
		let pos = lastIndexOfSpace( text );
		while ( pos === -1 ) {
			const prev = onlyTextNode( startTextNode.previousSibling );
			if ( prev === null ) {
				break;
			}
			// filter the completers to those that could handle this node
			completers = filter( completers,
				( { allowNode = allowAnything } ) => allowNode( endTextNode, container ) );
			// exit early if nothing can handle it
			if ( completers.length === 0 ) {
				return null;
			}
			startTextNode = prev;
			text = prev.nodeValue + text;
			pos = lastIndexOfSpace( prev.nodeValue );
		}
		// exit early if nothing can handle it
		if ( text.length <= pos + 1 ) {
			return null;
		}
		// find a completer that matches
		const open = find( completers, ( { triggerPrefix = '', allowContext = allowAnything } ) => {
			if ( text.substr( pos + 1, triggerPrefix.length ) !== triggerPrefix ) {
				return false;
			}
			const range = this.createRange( startTextNode, pos + 1, endTextNode, endIndex );
			const before = this.createRange( container, 0, startTextNode, pos + 1 );
			const after = this.createRange( endTextNode, endIndex, container, container.childNodes.length );
			if ( ! allowContext( before, range, after ) ) {
				return false;
			}
			return true;
		} );
		if ( open ) {
			const { triggerPrefix = '' } = open;
			const range = this.createRange( startTextNode, pos + 1, endTextNode, endIndex );
			const query = text.substr( pos + 1 + triggerPrefix.length );
			return { open, range, query };
		}
		return null;
	}

	search( event ) {
		const { open: wasOpen } = this.state;
		const { completers } = this.props;
		// ensure that the cursor location is unambiguous
		const container = event.target;
		const cursor = this.getCursor( container );
		// look for the trigger prefix and search query just before the cursor location
		const match = this.findMatch( container, cursor, completers, wasOpen );
		const { open, query, range } = match || {};
		// create a regular expression to filter the options
		const search = open ? new RegExp( escapeStringRegexp( query ), 'i' ) : /./;
		// asynchronously load the options for the open completer
		if ( open && ( ! wasOpen || open.idx !== wasOpen.idx ) ) {
			this.loadOptions( open.idx );
		}
		// update the state
		if ( wasOpen || open ) {
			this.setState( { selectedIndex: 0, search, open, query, range } );
		}
	}

	getFilteredOptions() {
		const { maxResults = 10 } = this.props;
		const { search, open } = this.state;
		if ( ! open ) {
			return [];
		}
		const options = this.state[ 'options_' + open.idx ] || [];

		const filtered = [];
		for ( let i = 0; i < options.length; i++ ) {
			const option = options[ i ];

			// Merge label into keywords
			let { keywords = [] } = option;
			if ( 'string' === typeof option.label ) {
				keywords = [ ...keywords, option.label ];
			}

			const isMatch = keywords.some( ( keyword ) => search.test( keyword ) );
			if ( ! isMatch ) {
				continue;
			}

			filtered.push( option );

			// Abort early if max reached
			if ( filtered.length === maxResults ) {
				break;
			}
		}

		return filtered;
	}

	setSelectedIndex( event ) {
		const { open, selectedIndex } = this.state;
		if ( ! open ) {
			return;
		}
		const options = this.getFilteredOptions();
		if ( options.length === 0 ) {
			return;
		}

		let nextSelectedIndex;
		switch ( event.keyCode ) {
			case UP:
				nextSelectedIndex = ( selectedIndex === 0 ? options.length : selectedIndex ) - 1;
				this.setState( { selectedIndex: nextSelectedIndex } );
				break;

			case DOWN:
				nextSelectedIndex = ( selectedIndex + 1 ) % options.length;
				this.setState( { selectedIndex: nextSelectedIndex } );
				break;

			case ESCAPE:
				this.reset();
				break;

			case ENTER:
				this.select( options[ selectedIndex ] );
				break;

			case LEFT:
			case RIGHT:
			case TAB:
				this.reset();
				return;

			default:
				return;
		}

		// Any handled keycode should prevent original behavior. This relies on
		// the early return in the default case.
		event.preventDefault();
		event.stopPropagation();
	}

	toggleKeyEvents( isListening ) {
		// This exists because we must capture ENTER key presses before Editable.
		// It seems that react fires the simulated capturing events after the
		// native browser event has already bubbled so we can't stopPropagation
		//  and avoid Editable getting the event from TinyMCE, hence we must
		// register a native event handler.
		if ( ! this.node ) {
			return;
		}
		// Disable reason: We need to add native event handlers because they must
		// be able to cancel the event before TinyMCE's native event handler gets it.
		// eslint-disable-next-line react/no-find-dom-node
		const realNode = findDOMNode( this.node );
		const handler = isListening ? 'addEventListener' : 'removeEventListener';
		realNode[ handler ]( 'keydown', this.setSelectedIndex, true );
	}

	componentDidUpdate( prevProps, prevState ) {
		const { open } = this.state;
		const { open: prevOpen } = prevState;
		if ( ( ! open ) !== ( ! prevOpen ) ) {
			this.toggleKeyEvents( ! ! open );
		}
	}

	componentWillUnmount() {
		this.toggleKeyEvents( false );
	}

	render() {
		const { children, instanceId } = this.props;
		const { open, selectedIndex, range } = this.state;
		const { className } = open || {};
		const classes = classnames( 'components-autocomplete__popover', className );
		const filteredOptions = this.getFilteredOptions();
		const isExpanded = filteredOptions.length > 0;
		const listBoxId = isExpanded ? `components-autocomplete-listbox-${ instanceId }` : null;
		const activeId = isExpanded ? `components-autocomplete-item-${ instanceId }-${ selectedIndex }` : null;

		return (
			<div
				ref={ this.bindNode }
				onInput={ this.search }
				className="components-autocomplete"
			>
				{ children( { isExpanded, listBoxId, activeId } ) }
				<Popover
					isOpen={ isExpanded }
					focusOnOpen={ false }
					onClose={ () => this.reset() }
					position="top right"
					className={ classes }
					range={ range }
				>
					<ul
						id={ listBoxId }
						role="listbox"
						className="components-autocomplete__results"
					>
						{ map( filteredOptions, ( option, index ) => (
							<li
								key={ option.key }
								id={ `components-autocomplete-item-${ instanceId }-${ index }` }
								role="option"
								aria-selected={ index === selectedIndex }
								className={ classnames( 'components-autocomplete__result', {
									'is-selected': index === selectedIndex,
								} ) }
							>
								<Button onClick={ () => this.select( option ) }>
									{ option.label }
								</Button>
							</li>
						) ) }
					</ul>
				</Popover>
			</div>
		);
	}
}

export default withInstanceId( Autocomplete );
