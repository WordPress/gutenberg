/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, createRef, useMemo } from '@wordpress/element';
import {
	ToggleControl,
	withSpokenMessages,
} from '@wordpress/components';
import { LEFT, RIGHT, UP, DOWN, BACKSPACE, ENTER } from '@wordpress/keycodes';
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
	const anchorRef = useMemo( () => {
		const selection = window.getSelection();

		if ( ! selection.rangeCount ) {
			return;
		}

		const range = selection.getRangeAt( 0 );

		if ( addingLink ) {
			return range;
		}

		let element = range.startContainer;

		// If the caret is right before the element, select the next element.
		element = element.nextElementSibling || element;

		while ( element.nodeType !== window.Node.ELEMENT_NODE ) {
			element = element.parentNode;
		}

		return element.closest( 'a' );
	}, [ isActive, addingLink, value.start, value.end ] );

	if ( ! anchorRef ) {
		return null;
	}

	return <URLPopover anchorRef={ anchorRef } { ...props } />;
};

class InlineLinkUI extends Component {
	constructor() {
		super( ...arguments );

		this.editLink = this.editLink.bind( this );
		this.submitLink = this.submitLink.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.onChangeInputValue = this.onChangeInputValue.bind( this );
		this.setLinkTarget = this.setLinkTarget.bind( this );
		this.onFocusOutside = this.onFocusOutside.bind( this );
		this.resetState = this.resetState.bind( this );
		this.autocompleteRef = createRef();

		this.state = {
			opensInNewWindow: false,
			inputValue: '',
		};
	}

	static getDerivedStateFromProps( props, state ) {
		const { activeAttributes: { url, target } } = props;
		const opensInNewWindow = target === '_blank';

		if ( ! isShowingInput( props, state ) ) {
			const update = {};
			if ( url !== state.inputValue ) {
				update.inputValue = url;
			}

			if ( opensInNewWindow !== state.opensInNewWindow ) {
				update.opensInNewWindow = opensInNewWindow;
			}
			return Object.keys( update ).length ? update : null;
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

	setLinkTarget( opensInNewWindow ) {
		const { activeAttributes: { url = '' }, value, onChange } = this.props;

		this.setState( { opensInNewWindow } );

		// Apply now if URL is not being edited.
		if ( ! isShowingInput( this.props, this.state ) ) {
			const selectedText = getTextContent( slice( value ) );

			onChange( applyFormat( value, createLinkFormat( {
				url,
				opensInNewWindow,
				text: selectedText,
			} ) ) );
		}
	}

	editLink( event ) {
		this.setState( { editLink: true } );
		event.preventDefault();
	}

	submitLink( event ) {
		const { isActive, value, onChange, speak } = this.props;
		const { inputValue, opensInNewWindow } = this.state;
		const url = prependHTTP( inputValue );
		const selectedText = getTextContent( slice( value ) );
		const format = createLinkFormat( {
			url,
			opensInNewWindow,
			text: selectedText,
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

	onFocusOutside() {
		// The autocomplete suggestions list renders in a separate popover (in a portal),
		// so onFocusOutside fails to detect that a click on a suggestion occurred in the
		// LinkContainer. Detect clicks on autocomplete suggestions using a ref here, and
		// return to avoid the popover being closed.
		const autocompleteElement = this.autocompleteRef.current;
		if ( autocompleteElement && autocompleteElement.contains( document.activeElement ) ) {
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

		const { inputValue, opensInNewWindow } = this.state;
		const showInput = isShowingInput( this.props, this.state );

		return (
			<URLPopoverAtLink
				value={ value }
				isActive={ isActive }
				addingLink={ addingLink }
				onFocusOutside={ this.onFocusOutside }
				onClose={ this.resetState }
				focusOnMount={ showInput ? 'firstElement' : false }
				renderSettings={ () => (
					<ToggleControl
						label={ __( 'Open in New Tab' ) }
						checked={ opensInNewWindow }
						onChange={ this.setLinkTarget }
					/>
				) }
			>
				{ showInput ? (
					<URLPopover.LinkEditor
						className="block-editor-format-toolbar__link-container-content"
						value={ inputValue }
						onChangeInputValue={ this.onChangeInputValue }
						onKeyDown={ this.onKeyDown }
						onKeyPress={ stopKeyPropagation }
						onSubmit={ this.submitLink }
						autocompleteRef={ this.autocompleteRef }
					/>
				) : (
					<URLPopover.LinkViewer
						className="block-editor-format-toolbar__link-container-content"
						onKeyPress={ stopKeyPropagation }
						url={ url }
						onEditLinkClick={ this.editLink }
						linkClassName={ isValidHref( prependHTTP( url ) ) ? undefined : 'has-invalid-link' }
					/>
				) }
			</URLPopoverAtLink>
		);
	}
}

export default withSpokenMessages( InlineLinkUI );
