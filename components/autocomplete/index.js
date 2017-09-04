/**
 * External dependencies
 */
import escapeStringRegexp from 'escape-string-regexp';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Children, Component, cloneElement } from '@wordpress/element';
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './style.scss';
import Button from '../button';
import Popover from '../popover';

const { ENTER, ESCAPE, UP, DOWN } = keycodes;

class Autocomplete extends Component {
	static getInitialState() {
		return {
			isOpen: false,
			search: /.*/,
			selectedIndex: 0,
		};
	}

	constructor() {
		super( ...arguments );

		this.bindNode = this.bindNode.bind( this );
		this.select = this.select.bind( this );
		this.reset = this.reset.bind( this );
		this.onBlur = this.onBlur.bind( this );
		this.search = this.search.bind( this );
		this.setSelectedIndex = this.setSelectedIndex.bind( this );

		this.state = this.constructor.getInitialState();
	}

	bindNode( node ) {
		this.node = node;
	}

	select( option ) {
		const { onSelect } = this.props;

		this.reset();

		if ( onSelect ) {
			onSelect( option );
		}
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

	search( event ) {
		const { triggerPrefix } = this.props;
		const { isOpen } = this.state;

		const value = event.target.textContent;

		// Currently search supports only if input's entire value is match
		let pattern = '^';

		if ( triggerPrefix ) {
			// Trigger prefix may contain reserved characters of a regular
			// expression, so escape
			pattern += escapeStringRegexp( triggerPrefix );
		}

		// Create matching group for the search value
		pattern += '([^\\s]*)$';

		pattern = new RegExp( pattern );

		let match, search;
		if ( ( match = value.match( pattern ) ) ) {
			search = new RegExp( escapeStringRegexp( match[ 1 ] ), 'i' );
		}

		if ( isOpen ) {
			if ( match ) {
				// Reset selection to initial when search changes
				this.setState( {
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
		const { isOpen, selectedIndex } = this.state;
		if ( ! isOpen ) {
			return;
		}

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
				this.select( options[ selectedIndex ] );
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
		const { children, className } = this.props;
		const { isOpen, selectedIndex } = this.state;
		const classes = classnames( 'components-autocomplete__popover', className );

		// Blur is applied to the wrapper node, since if the child is Editable,
		// the event will not have `relatedTarget` assigned.
		return (
			<div
				ref={ this.bindNode }
				onBlur={ this.onBlur }
				className="components-autocomplete"
			>
				{ cloneElement( Children.only( children ), {
					onInput: this.search,
					onKeyDown: this.setSelectedIndex,
				} ) }
				<Popover
					isOpen={ isOpen }
					position="top right"
					className={ classes }
				>
					<ul
						role="menu"
						className="components-autocomplete__results"
					>
						{ this.getFilteredOptions().map( ( option, index ) => (
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
