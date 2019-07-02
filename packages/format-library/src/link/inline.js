/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, createRef, useMemo } from '@wordpress/element';
import {
	withSpokenMessages,
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
import OpenInNewTabToggle from './open-in-new-tab-toggle';
import NoFollowToggle from './no-follow-toggle';

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
	constructor( props ) {
		super( ...arguments );

		this.editLink = this.editLink.bind( this );
		this.submitLink = this.submitLink.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.onChangeInputValue = this.onChangeInputValue.bind( this );
		this.onClickOutside = this.onClickOutside.bind( this );
		this.resetState = this.resetState.bind( this );
		this.setLinkAttributes = this.setLinkAttributes.bind( this );
		this.autocompleteRef = createRef();

		this.state = {
			attributes: props.activeAttributes,
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
			attributes,
		}, () => {
			// Don't apply if URL is being edited.
			if ( isShowingInput( this.props, this.state ) ) {
				return;
			}

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

	editLink( event ) {
		this.setState( { editLink: true } );
		event.preventDefault();
	}

	submitLink( event ) {
		const { isActive, value, onChange, speak } = this.props;
		const { inputValue } = this.state;
		const url = prependHTTP( inputValue );
		const format = createLinkFormat( {
			url,
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
		const selectedText = getTextContent( slice( value ) );

		return (
			<URLPopoverAtLink
				value={ value }
				isActive={ isActive }
				addingLink={ addingLink }
				onClickOutside={ this.onClickOutside }
				onClose={ this.resetState }
				focusOnMount={ showInput ? 'firstElement' : false }
				renderSettings={ () => (
					<div className="editor-format-toolbar__link-settings-container">
						<OpenInNewTabToggle
							url={ url }
							text={ selectedText }
							attributes={ this.state.attributes }
							setLinkAttributes={ this.setLinkAttributes }
						/>
						<NoFollowToggle
							url={ url }
							text={ selectedText }
							attributes={ this.state.attributes }
							setLinkAttributes={ this.setLinkAttributes }
						/>
					</div>
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
