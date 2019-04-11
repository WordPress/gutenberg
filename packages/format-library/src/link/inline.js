/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, createRef } from '@wordpress/element';
import {
	ExternalLink,
	IconButton,
	ToggleControl,
	withSpokenMessages,
	PositionedAtSelection,
} from '@wordpress/components';
import { LEFT, RIGHT, UP, DOWN, BACKSPACE, ENTER } from '@wordpress/keycodes';
import { prependHTTP, safeDecodeURI, filterURLForDisplay } from '@wordpress/url';
import {
	create,
	insert,
	isCollapsed,
	applyFormat,
	getTextContent,
	slice,
	getActiveFormat,
} from '@wordpress/rich-text';
import { URLInput, URLPopover } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { createLinkFormat, isValidHref } from './utils';

const stopKeyPropagation = ( event ) => event.stopPropagation();

function isShowingInput( props, state ) {
	return props.addingLink || state.editLink;
}

const LinkEditor = ( { value, onChangeInputValue, onKeyDown, submitLink, autocompleteRef } ) => (
	// Disable reason: KeyPress must be suppressed so the block doesn't hide the toolbar
	/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
	<form
		className="editor-format-toolbar__link-container-content block-editor-format-toolbar__link-container-content"
		onKeyPress={ stopKeyPropagation }
		onKeyDown={ onKeyDown }
		onSubmit={ submitLink }
	>
		<URLInput
			value={ value }
			onChange={ onChangeInputValue }
			autocompleteRef={ autocompleteRef }
		/>
		<IconButton icon="editor-break" label={ __( 'Apply' ) } type="submit" />
	</form>
	/* eslint-enable jsx-a11y/no-noninteractive-element-interactions */
);

const LinkViewerUrl = ( { url } ) => {
	const prependedURL = prependHTTP( url );
	const linkClassName = classnames( 'editor-format-toolbar__link-container-value block-editor-format-toolbar__link-container-value', {
		'has-invalid-link': ! isValidHref( prependedURL ),
	} );

	if ( ! url ) {
		return <span className={ linkClassName }></span>;
	}

	return (
		<ExternalLink
			className={ linkClassName }
			href={ url }
		>
			{ filterURLForDisplay( safeDecodeURI( url ) ) }
		</ExternalLink>
	);
};

const LinkViewer = ( { url, editLink } ) => {
	return (
		// Disable reason: KeyPress must be suppressed so the block doesn't hide the toolbar
		/* eslint-disable jsx-a11y/no-static-element-interactions */
		<div
			className="editor-format-toolbar__link-container-content block-editor-format-toolbar__link-container-content"
			onKeyPress={ stopKeyPropagation }
		>
			<LinkViewerUrl url={ url } />
			<IconButton icon="edit" label={ __( 'Edit' ) } onClick={ editLink } />
		</div>
		/* eslint-enable jsx-a11y/no-static-element-interactions */
	);
};

class InlineLinkUI extends Component {
	constructor() {
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
			opensInNewWindow: false,
			inputValue: '',
			key: 0,
		};
	}

	static getDerivedStateFromProps( props, state ) {
		const { activeAttributes: { url, target }, value } = props;
		const opensInNewWindow = target === '_blank';
		const activeFormat = getActiveFormat( value, 'core/link' );

		const newState = {};

		if ( ! isShowingInput( props, state ) ) {
			if ( url !== state.inputValue ) {
				newState.inputValue = url;
			}

			if ( opensInNewWindow !== state.opensInNewWindow ) {
				newState.opensInNewWindow = opensInNewWindow;
			}
		}

		if ( activeFormat && activeFormat !== state.activeFormat ) {
			newState.activeFormat = activeFormat;
			newState.key = state.key + 1;
		}

		if ( Object.keys( newState ).length ) {
			return newState;
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
		const { isActive, activeAttributes: { url }, addingLink } = this.props;

		if ( ! isActive && ! addingLink ) {
			return null;
		}

		const { inputValue, opensInNewWindow } = this.state;
		const showInput = isShowingInput( this.props, this.state );

		return (
			<PositionedAtSelection
				// When adding a new link, set the container at the caret,
				// otherwise set it at the link element.
				selector={ addingLink ? null : 'a' }
				// Since the key cannot be the format object, we have to keep it
				// in the state and bump it when the object reference changes.
				key={ this.state.key }
			>
				<URLPopover
					onClickOutside={ this.onClickOutside }
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
						<LinkEditor
							value={ inputValue }
							onChangeInputValue={ this.onChangeInputValue }
							onKeyDown={ this.onKeyDown }
							submitLink={ this.submitLink }
							autocompleteRef={ this.autocompleteRef }
						/>
					) : (
						<LinkViewer
							url={ url }
							editLink={ this.editLink }
						/>
					) }
				</URLPopover>
			</PositionedAtSelection>
		);
	}
}

export default withSpokenMessages( InlineLinkUI );
