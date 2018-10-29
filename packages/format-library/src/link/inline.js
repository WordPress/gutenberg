/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import { Component, createRef } from '@wordpress/element';
import {
	ExternalLink,
	IconButton,
	ToggleControl,
	withSpokenMessages,
} from '@wordpress/components';
import { ESCAPE, LEFT, RIGHT, UP, DOWN, BACKSPACE, ENTER } from '@wordpress/keycodes';
import { prependHTTP, safeDecodeURI, filterURLForDisplay } from '@wordpress/url';
import {
	create,
	insert,
	isCollapsed,
	applyFormat,
} from '@wordpress/rich-text';
import { URLInput, URLPopover } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import PositionedAtSelection from './positioned-at-selection';

const stopKeyPropagation = ( event ) => event.stopPropagation();

/**
 * Generates the format object that will be applied to the link text.
 *
 * @param {string}  href             The href of the link.
 * @param {boolean} opensInNewWindow Whether this link will open in a new window.
 * @param {Object}  record           The object that contains the text being wrapped in the a tag.
 *
 * @return {Object} The final format object.
 */
function createLinkFormat( { url, opensInNewWindow, record } ) {
	const format = {
		type: 'core/link',
		attributes: {
			url,
		},
	};

	const text = record.text || '';
	// translators: accessibility label for external links, where the argument is the link text
	const label = sprintf( __( '%s (opens in a new tab)' ), text ).trim();

	if ( opensInNewWindow ) {
		format.attributes.target = '_blank';
		format.attributes.rel = 'noreferrer noopener';
		format.attributes[ 'aria-label' ] = label;
	}

	return format;
}

function isShowingInput( props, state ) {
	return props.addingLink || state.editLink;
}

const LinkEditor = ( { value, onChangeInputValue, onKeyDown, submitLink, autocompleteRef } ) => (
	// Disable reason: KeyPress must be suppressed so the block doesn't hide the toolbar
	/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
	<form
		className="editor-format-toolbar__link-container-content"
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

const LinkViewer = ( { url, editLink } ) => (
	// Disable reason: KeyPress must be suppressed so the block doesn't hide the toolbar
	/* eslint-disable jsx-a11y/no-static-element-interactions */
	<div
		className="editor-format-toolbar__link-container-content"
		onKeyPress={ stopKeyPropagation }
	>
		<ExternalLink
			className="editor-format-toolbar__link-container-value"
			href={ url }
		>
			{ filterURLForDisplay( safeDecodeURI( url ) ) }
		</ExternalLink>
		<IconButton icon="edit" label={ __( 'Edit' ) } onClick={ editLink } />
	</div>
	/* eslint-enable jsx-a11y/no-static-element-interactions */
);

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

		this.state = {};
	}

	static getDerivedStateFromProps( props, state ) {
		const { activeAttributes: { url, target } } = props;
		const opensInNewWindow = target === '_blank';

		if ( ! isShowingInput( props, state ) ) {
			if ( url !== state.inputValue ) {
				return { inputValue: url };
			}

			if ( opensInNewWindow !== state.opensInNewWindow ) {
				return { opensInNewWindow };
			}
		}

		return null;
	}

	onKeyDown( event ) {
		if ( event.keyCode === ESCAPE ) {
			event.stopPropagation();
			this.resetState();
		}

		if ( [ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ].indexOf( event.keyCode ) > -1 ) {
			// Stop the key event from propagating up to ObserveTyping.startTypingInTextField.
			event.stopPropagation();
		}
	}

	onChangeInputValue( inputValue ) {
		this.setState( { inputValue } );
	}

	setLinkTarget( opensInNewWindow ) {
		const { activeAttributes: { url }, value, onChange } = this.props;

		this.setState( { opensInNewWindow } );

		// Apply now if URL is not being edited.
		if ( ! isShowingInput( this.props, this.state ) ) {
			const { record } = this.props;
			onChange( applyFormat( value, createLinkFormat( { url, opensInNewWindow, record } ) ) );
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
		const record = { text: 'test' };
		const format = createLinkFormat( { url, opensInNewWindow, record } );

		event.preventDefault();

		if ( isCollapsed( value ) && ! isActive ) {
			const toInsert = applyFormat( create( { text: url } ), format, 0, url.length );
			onChange( insert( value, toInsert ) );
		} else {
			onChange( applyFormat( value, format ) );
		}

		this.resetState();

		if ( isActive ) {
			speak( __( 'Link edited.' ), 'assertive' );
		} else {
			speak( __( 'Link added.' ), 'assertive' );
		}
	}

	onClickOutside( event ) {
		// The autocomplete suggestions list renders in a separate popover (in a portal),
		// so onClickOutside fails to detect that a click on a suggestion occured in the
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

		const { inputValue, opensInNewWindow } = this.state;
		const showInput = isShowingInput( this.props, this.state );

		return (
			<PositionedAtSelection
				key={ `${ value.start }${ value.end }` /* Used to force rerender on selection change */ }
			>
				<URLPopover
					onClickOutside={ this.onClickOutside }
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
