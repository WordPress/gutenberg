/**
 * External dependencies
 */
import escapeStringRegexp from 'escape-string-regexp';
import classnames from 'classnames';
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, findDOMNode } from '@wordpress/element';
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './style.scss';
import Button from '../button';
import Popover from '../popover';

const { ENTER, ESCAPE, UP, DOWN } = keycodes;

function descendFirst( node ) {
	let n = node;
	while ( n.firstChild ) {
		n = n.firstChild;
	}
	return n;
}

function descendLast( node ) {
	let n = node;
	while ( n.lastChild ) {
		n = n.lastChild;
	}
	return n;
}

function isTextNode( node ) {
	return node !== null && node.nodeType === 3;
}

function onlyTextNode( node ) {
	return isTextNode( node ) ? node : null;
}

function lastIndexOfSpace( text, fromIndex ) {
	const fromI = fromIndex === undefined ?
			text.length - 1 :
			Math.min( text.length - 1, fromIndex );
	for ( let i = fromI; i >= 0; i-- ) {
		if ( /\s/.test( text.charAt( i ) ) ) {
			return i;
		}
	}
	return -1;
}

class Autocomplete extends Component {
	static getInitialState() {
		return {
			open: null,
			search: /./,
			selectedIndex: 0,
			lookup: null,
			range: null,
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
		this.allOptions = {};
	}

	bindNode( node ) {
		this.node = node;
	}

	select( option ) {
		const { open, range, lookup } = this.state;
		const { onSelect } = open;

		this.reset();

		if ( onSelect ) {
			onSelect( option, range, lookup );
		}
	}

	reset() {
		this.setState( this.constructor.getInitialState() );
	}

	search( event ) {
		const { completers: allCompleters } = this.props;
		const allowAnything = () => true;
		const { open } = this.state;
		// ensure that the cursor location is unambiguous
		const container = event.target;
		const selection = window.getSelection();
		if ( ! ( selection.isCollapsed && container.contains( selection.anchorNode ) ) ) {
			return;
		}
		// look for the trigger prefix and search query just before the cursor location
		const match = ( function() {
			let endTextNode;
			let endIndex;
			let completers = allCompleters.map( ( completer, idx ) => ( { ...completer, idx } ) );
			if ( open !== null ) {
				// put the open completer at the start so it has priority
				completers = [
					open,
					...completers.filter( ( completer ) => completer.idx !== open.idx ),
				];
			}
			// search backwards to find the first preceeding space or non-text node.
			if ( isTextNode( selection.anchorNode ) ) { // TEXT node
				endTextNode = selection.anchorNode;
				endIndex = selection.anchorOffset;
			} else if ( selection.anchorOffset === 0 ) {
				endTextNode = onlyTextNode( descendFirst( selection.anchorNode ) );
				endIndex = 0;
			} else {
				endTextNode = onlyTextNode( descendLast( selection.anchorNode.childNodes[ selection.anchorOffset - 1 ] ) );
				endIndex = endTextNode ? endTextNode.nodeValue.length : 0;
			}
			if ( endTextNode === null ) {
				return null;
			}
			// filter the completers to those that could handle this node
			completers = completers.filter( ( { allowNode = allowAnything } ) => allowNode( endTextNode, container ) );
			// exit early if nothing can handle it
			if ( completers.length === 0 ) {
				return null;
			}
			let startTextNode = endTextNode;
			let text = endTextNode.nodeValue.substring( 0, endIndex );
			let pos = lastIndexOfSpace( text );
			while ( pos === -1 ) {
				const prev = onlyTextNode( startTextNode.previousSibling );
				if ( prev ) {
					// filter the completers to those that could handle this node
					completers = completers.filter( ( { allowNode = allowAnything } ) => allowNode( endTextNode, container ) );
					// exit early if nothing can handle it
					if ( completers.length === 0 ) {
						return null;
					}
					startTextNode = prev;
					text = prev.nodeValue + text;
					pos = lastIndexOfSpace( text, prev.nodeValue.length - 1 );
				} else {
					break;
				}
			}
			// find a completer that matches
			const completer = find( completers, ( { triggerPrefix = '', allowContext = allowAnything } ) => {
				if ( text.substr( pos + 1, triggerPrefix.length ) !== triggerPrefix ) {
					return false;
				}
				const range = document.createRange();
				range.setStart( startTextNode, pos + 1 );
				range.setEnd( endTextNode, endIndex );
				const before = document.createRange();
				before.setStart( container, 0 );
				before.setEnd( range.startContainer, range.startOffset );
				const after = document.createRange();
				after.setStart( range.endContainer, range.endOffset );
				after.setEnd( container, container.childNodes.length );
				if ( ! allowContext( before, range, after ) ) {
					return false;
				}
				return true;
			} );
			if ( completer ) {
				const { triggerPrefix } = completer;
				const range = document.createRange();
				range.setStart( startTextNode, pos + 1 );
				range.setEnd( endTextNode, endIndex );
				const lookup = text.substr( pos + 1 + triggerPrefix.length );
				return {
					completer,
					range,
					lookup,
				};
			}
			return null;
		} )();
		// create a regular expression to filter the options
		const search = match ? new RegExp( escapeStringRegexp( match.lookup ), 'i' ) : /./;
		// update the state
		if ( open ) {
			if ( match ) {
				// Reset selection to initial when search changes
				this.setState( {
					selectedIndex: 0,
					search,
					open: match.completer,
					lookup: match.lookup,
					range: match.range,
				} );
			} else {
				// This may occur when pressing space, for example
				this.reset();
			}
		} else if ( match ) {
			this.setState( {
				selectedIndex: 0,
				search,
				open: match.completer,
				lookup: match.lookup,
				range: match.range,
			} );
		}
	}

	getFilteredOptions() {
		const { maxResults = 10 } = this.props;
		const { search, open } = this.state;
		if ( open === null ) {
			return [];
		}
		const { idx } = open;
		const options = this.allOptions[ idx ];
		if ( ! options ) {
			return [];
		}

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

			default:
				return;
		}

		// Any handled keycode should prevent original behavior. This relies on
		// the early return in the default case.
		event.preventDefault();
		event.stopPropagation();
	}

	toggleKeyEvents( isListening ) {
		if ( ! this.node ) {
			return;
		}
		const realNode = findDOMNode( this.node );
		const handler = isListening ? 'addEventListener' : 'removeEventListener';
		realNode[ handler ]( 'keydown', this.setSelectedIndex, true );
	}

	componentWillMount() {
		const { completers } = this.props;
		completers.forEach( ( { getOptions }, idx ) => {
			getOptions().then( ( options ) => {
				this.allOptions[ idx ] = options;
				this.forceUpdate();
			} );
		} );
	}

	componentDidUpdate( prevProps, prevState ) {
		const { open } = this.state;
		const { open: prevOpen } = prevState;
		if ( ( open !== null ) !== ( prevOpen !== null ) ) {
			this.toggleKeyEvents( open !== null );
		}
	}

	componentWillUnmount() {
		this.toggleKeyEvents( false );
	}

	render() {
		const { children } = this.props;
		const { open, selectedIndex, range } = this.state;
		const { className } = open || {};
		const classes = classnames( 'components-autocomplete__popover', className );
		const filteredOptions = this.getFilteredOptions();

		// Blur is applied to the wrapper node, since if the child is Editable,
		// the event will not have `relatedTarget` assigned.
		return (
			<div
				ref={ this.bindNode }
				onInput={ this.search }
				className="components-autocomplete"
			>
				{ children }
				<Popover
					isOpen={ filteredOptions.length > 0 }
					focusOnOpen={ false }
					onClickOutside={ () => this.reset() }
					position="top right"
					className={ classes }
					range={ range }
				>
					<ul
						role="menu"
						className="components-autocomplete__results"
					>
						{ filteredOptions.map( ( option, index ) => (
							<li
								key={ option.value }
								role="menuitem"
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

export default Autocomplete;
