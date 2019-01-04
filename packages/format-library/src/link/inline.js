/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import { Component, createRef, Fragment, useMemo } from '@wordpress/element';
import {
	ToggleControl,
	withSpokenMessages,
	Slot,
} from '@wordpress/components';
import { LEFT, RIGHT, UP, DOWN, BACKSPACE, ENTER } from '@wordpress/keycodes';
import { getRectangleFromRange } from '@wordpress/dom';
import { prependHTTP } from '@wordpress/url';
import {
	create,
	insert,
	isCollapsed,
	applyFormat,
	getTextContent,
	slice,
} from '@wordpress/rich-text';
import { URLPopover } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { createLinkFormat, isValidHref } from './utils';

const stopKeyPropagation = ( event ) => event.stopPropagation();

function isShowingInput( props, state ) {
	return props.addingLink || state.editLink;
}

const URLPopoverAtLink = ( { isActive, addingLink, value, ...props } ) => {
	const anchorRect = useMemo( () => {
		const selection = window.getSelection();
		const range = selection.rangeCount > 0 ? selection.getRangeAt( 0 ) : null;
		if ( ! range ) {
			return;
		}

		if ( addingLink ) {
			return getRectangleFromRange( range );
		}

		let element = range.startContainer;

		// If the caret is right before the element, select the next element.
		element = element.nextElementSibling || element;

		while ( element.nodeType !== window.Node.ELEMENT_NODE ) {
			element = element.parentNode;
		}

		const closest = element.closest( 'a' );
		if ( closest ) {
			return closest.getBoundingClientRect();
		}
	}, [ isActive, addingLink, value.start, value.end ] );

	if ( ! anchorRect ) {
		return null;
	}

	return <URLPopover anchorRect={ anchorRect } { ...props } />;
};

class InlineLinkUI extends Component {
	constructor( { activeAttributes } ) {
		super( ...arguments );

		this.editLink = this.editLink.bind( this );
		this.submitLink = this.submitLink.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.onChangeInputValue = this.onChangeInputValue.bind( this );
		this.setLinkTarget = this.setLinkTarget.bind( this );
		this.onClickOutside = this.onClickOutside.bind( this );
		this.resetState = this.resetState.bind( this );
		this.autocompleteRef = createRef();

		this.state = {
			attributes: activeAttributes,
			inputValue: '',
		};
	}

	static getDerivedStateFromProps( props, state ) {
		const { activeAttributes: { url } } = props;

		if ( ! isShowingInput( props, state ) ) {
			if ( url !== state.inputValue ) {
				return { inputValue: url };
			}
		}

		return null;
	}

	onKeyDown( event ) {
		if ( [ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ].indexOf( event.keyCode ) > -1 ) {
			// Stop the key event from propagating up to ObserveTyping.startTypingInTextField.
			event.stopPropagation();
		}
	}

	onChangeInputValue( inputValue ) {
		this.setState( { inputValue } );
	}

	setLinkAttributes( attributes ) {
		this.setState( {
			...this.state,
			attributes,
		}, () => {
			const {
				value,
				onChange,
				activeAttributes: {
					url,
				},
			} = this.props;

			onChange( applyFormat( value, createLinkFormat( {
				...this.state.attributes,
				url,
			} ) ) );
		} );
	}

	setLinkTarget( opensInNewWindow ) {
		const { attributes = { url: '' }, value } = this.props;

		// Apply now if URL is not being edited.
		if ( ! isShowingInput( this.props, this.state ) ) {
			const selectedText = getTextContent( slice( value ) );

			if ( opensInNewWindow ) {
				let rel = 'noopener noreferrer';

				if ( attributes.rel ) {
					rel = [ rel, attributes.rel ].join( ' ' );
				}

				this.setLinkAttributes( {
					'aria-label': sprintf( __( '%s (opens in a new tab)' ), selectedText ),
					target: '_blank',
					rel,
					...attributes,
				} );
			} else {
				if ( typeof attributes.rel === 'string' ) {
					attributes.rel = attributes.rel.split( ' ' ).filter( ( relItem ) => {
						return relItem !== 'noopener' && relItem !== 'noreferrer';
					} ).join( ' ' ).trim();
				} else {
					delete attributes.rel;
				}

				delete attributes.target;
				attributes[ 'aria-label' ] = selectedText;

				this.setLinkAttributes( attributes );
			}
		}
	}

	editLink( event ) {
		this.setState( { editLink: true } );
		event.preventDefault();
	}

	submitLink( event ) {
		const { isActive, value, onChange, speak } = this.props;
		const { inputValue } = this.state;
		const url = prependHTTP( inputValue );
		const selectedText = getTextContent( slice( value ) );
		const format = createLinkFormat( {
			url,
			text: selectedText,
			...this.state.attributes,
		} );

		event.preventDefault();

		if ( isCollapsed( value ) && ! isActive ) {
			const toInsert = applyFormat( create( { text: url } ), format, 0, url.length );
			onChange( insert( value, toInsert ) );
		} else {
			onChange( applyFormat( value, format ) );
		}

		this.resetState();

		if ( ! isValidHref( url ) ) {
			speak( __( 'Warning: the link has been inserted but may have errors. Please test it.' ), 'assertive' );
		} else if ( isActive ) {
			speak( __( 'Link edited.' ), 'assertive' );
		} else {
			speak( __( 'Link inserted.' ), 'assertive' );
		}
	}

	onClickOutside( event ) {
		// The autocomplete suggestions list renders in a separate popover (in a portal),
		// so onClickOutside fails to detect that a click on a suggestion occurred in the
		// LinkContainer. Detect clicks on autocomplete suggestions using a ref here, and
		// return to avoid the popover being closed.
		const autocompleteElement = this.autocompleteRef.current;
		if ( autocompleteElement && autocompleteElement.contains( event.target ) ) {
			return;
		}

		this.resetState();
	}

	resetState() {
		this.props.stopAddingLink();
		this.setState( { editLink: false } );
	}

	render() {
		const { isActive, activeAttributes: { url }, addingLink, value } = this.props;

		if ( ! isActive && ! addingLink ) {
			return null;
		}

		const { inputValue } = this.state;
		const showInput = isShowingInput( this.props, this.state );

		return (

			<URLPopoverAtLink
				value={ value }
				isActive={ isActive }
				addingLink={ addingLink }
				onClickOutside={ this.onClickOutside }
				onClose={ this.resetState }
				focusOnMount={ showInput ? 'firstElement' : false }
				renderSettings={ () => (
					<Fragment>
						<ToggleControl
							label={ __( 'Open in New Tab' ) }
							checked={ this.state.attributes.target === '_blank' }
							onChange={ this.setLinkTarget }
						/>
						<Slot
							name="LinkSettings"
							fillProps={ {
								attributes: this.state.attributes,
								setLinkAttributes: this.setLinkAttributes,
							} }
						/>
					</Fragment>
				) }
			>
				{ showInput ? (
					<URLPopover.__experimentalLinkEditor
						className="editor-format-toolbar__link-container-content block-editor-format-toolbar__link-container-content"
						value={ inputValue }
						onChangeInputValue={ this.onChangeInputValue }
						onKeyDown={ this.onKeyDown }
						onKeyPress={ stopKeyPropagation }
						onSubmit={ this.submitLink }
						autocompleteRef={ this.autocompleteRef }
					/>
				) : (
					<URLPopover.__experimentalLinkViewer
						className="editor-format-toolbar__link-container-content block-editor-format-toolbar__link-container-content"
						onKeyPress={ stopKeyPropagation }
						url={ url }
						editLink={ this.editLink }
						linkClassName={ isValidHref( prependHTTP( url ) ) ? undefined : 'has-invalid-link' }
					/>
				) }
			</URLPopoverAtLink>
		);
	}
}

export default withSpokenMessages( InlineLinkUI );
