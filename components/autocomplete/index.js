/**
 * External dependencies
 */
import escapeStringRegexp from 'escape-string-regexp';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import './style.scss';
import { Children, Component, cloneElement } from '@wordpress/element';
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import Button from '../button';

const { ENTER, ESCAPE, UP, DOWN } = keycodes;

class Autocomplete extends Component {
	static getInitialState() {
		return {
			isOpen: false,
			search: /.*/i,
			selectedIndex: 0,
			position: {},
		};
	}

	constructor() {
		super( ...arguments );

		this.bindNode = this.bindNode.bind( this );
		this.search = this.search.bind( this );
		this.reset = this.reset.bind( this );
		this.setSelectedIndex = this.setSelectedIndex.bind( this );
		this.onBlur = this.onBlur.bind( this );
		this.reposition = this.reposition.bind( this );

		this.state = this.constructor.getInitialState();
	}

	componentDidUpdate( prevProps, prevState ) {
		// Only monitor resizing and scroll events for duration of results open
		const { isOpen } = this.state;
		if ( isOpen === prevState.isOpen ) {
			return;
		}

		const bindFn = isOpen ? 'addEventListener' : 'removeEventListener';
		window[ bindFn ]( 'resize', this.reposition );
		window[ bindFn ]( 'scroll', this.reposition );
	}

	componentWillUnmount() {
		window.removeEventListener( 'resize', this.reposition );
		window.removeEventListener( 'scroll', this.reposition );
		window.cancelAnimationFrame( this.pendingReposition );
	}

	reposition() {
		this.pendingReposition = window.requestAnimationFrame( () => {
			this.setState( {
				position: this.getInputPosition(),
			} );
		} );
	}

	bindNode( node ) {
		this.node = node;
	}

	reset() {
		this.setState( this.constructor.getInitialState() );
	}

	onBlur( event ) {
		// Check if related target is not within, in the case that the user is
		// selecting an option by button click
		if ( ! this.node.contains( event.relatedTarget ) ) {
			this.reset();
		}
	}

	getInputPosition() {
		// Get position of bottom of text caret. Currently this only supports
		// contenteditable, but could be enhanced to support input and textarea
		// with a library like `textarea-caret-position`
		const range = window.getSelection().getRangeAt( 0 );
		if ( range ) {
			const { top, left, height } = range.getBoundingClientRect();
			return {
				top: top + height,
				left,
			};
		}
	}

	search( event ) {
		const { triggerPrefix, onlyEmpty } = this.props;
		const { isOpen } = this.state;

		const value = event.target.textContent;

		// Allow pattern at word boundary if not testing only empty
		let pattern = '';
		if ( onlyEmpty ) {
			pattern += '^';
		} else {
			pattern += '\b';
		}

		if ( triggerPrefix ) {
			// Trigger prefix may contain reserved characters of a regular
			// expression, so escape
			pattern += escapeStringRegexp( triggerPrefix );
		}

		// Create matching group for the search value
		pattern += '([^\b]*)';

		if ( onlyEmpty ) {
			pattern += '$';
		}

		pattern = new RegExp( pattern );

		let match, search;
		if ( ( match = value.match( pattern ) ) ) {
			search = new RegExp( escapeStringRegexp( match[ 1 ] ), 'i' );
		}

		if ( isOpen ) {
			if ( match ) {
				// Reset selection to initial when search changes
				this.setState( {
					position: this.getInputPosition(),
					selectedIndex: 0,
					search,
				} );
			} else {
				// This may occur when pressing space, for example
				this.reset();
			}
		} else if ( match ) {
			this.setState( {
				isOpen: true,
				position: this.getInputPosition(),
				search,
			} );
		}
	}

	getFilteredOptions() {
		const { options, maxResults = 10 } = this.props;
		const { search } = this.state;

		const filtered = [];
		for ( let i = 0; i < options.length; i++ ) {
			const option = options[ i ];

			// Merge label into keywords
			let { keywords = [] } = option;
			keywords = [ ...keywords, option.label ];

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
		const { isOpen, selectedIndex } = this.state;
		if ( ! isOpen ) {
			return;
		}

		const { onSelect } = this.props;
		const options = this.getFilteredOptions();

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
				this.reset();
				onSelect( options[ selectedIndex ] );
				break;

			default:
				return;
		}

		// Any handled keycode should prevent original behavior. This relies on
		// the early return in the default case.
		event.preventDefault();
		event.stopImmediatePropagation();
	}

	render() {
		const { children, onSelect, className } = this.props;
		const { position, isOpen, selectedIndex } = this.state;
		const classes = classnames( 'components-autocomplete', className );

		// Blur is applied to the wrapper node, since if the child is Editable,
		// the event will not have `relatedTarget` assigned.
		return (
			<div
				ref={ this.bindNode }
				onBlur={ this.onBlur }
				className={ classes }
			>
				{ cloneElement( Children.only( children ), {
					onInput: this.search,
					onKeyDown: this.setSelectedIndex,
				} ) }
				{ isOpen && (
					<ul
						style={ { ...position } }
						className="components-autocomplete__results"
					>
						{ this.getFilteredOptions().map( ( option, index ) => (
							<li
								key={ option.value }
								className={ classnames( 'components-autocomplete__result', {
									'is-selected': index === selectedIndex,
								} ) }
							>
								<Button onClick={ () => onSelect( option ) }>
									{ option.label }
								</Button>
							</li>
						) ) }
					</ul>
				) }
			</div>
		);
	}
}

export default Autocomplete;
