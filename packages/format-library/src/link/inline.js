/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, createRef } from '@wordpress/element';
import {
	ExternalLink,
	Fill,
	IconButton,
	ToggleControl,
	withSpokenMessages,
} from '@wordpress/components';
import { ESCAPE, LEFT, RIGHT, UP, DOWN, BACKSPACE, ENTER } from '@wordpress/keycodes';
import { prependHTTP, safeDecodeURI } from '@wordpress/url';
import {
	create,
	insert,
	isCollapsed,
	applyFormat,
} from '@wordpress/rich-text';
import { URLInput, filterURLForDisplay, URLPopover } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import PositionedAtSelection from './positioned-at-selection';

const stopKeyPropagation = ( event ) => event.stopPropagation();

function getLinkAttributesFromFormat( { attributes: { url = '', target } = {} } = {} ) {
	return { url, target };
}

function createLinkFormat( { url, opensInNewWindow } ) {
	const format = {
		type: 'core/link',
		attributes: {
			url,
		},
	};

	if ( opensInNewWindow ) {
		format.attributes.target = '_blank';
		format.attributes.rel = 'noreferrer noopener';
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
		<URLInput value={ value } onChange={ onChangeInputValue } />
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
		const { url, target } = getLinkAttributesFromFormat( props.link );
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
			// Stop the key event from propagating up to maybeStartTyping in BlockListBlock.
			event.stopPropagation();
		}
	}

	onChangeInputValue( inputValue ) {
		this.setState( { inputValue } );
	}

	setLinkTarget( opensInNewWindow ) {
		const { link, value, onChange } = this.props;

		this.setState( { opensInNewWindow } );

		// Apply now if URL is not being edited.
		if ( ! isShowingInput( this.props, this.state ) ) {
			const { url } = getLinkAttributesFromFormat( link );
			onChange( applyFormat( value, createLinkFormat( { url, opensInNewWindow } ) ) );
		}
	}

	editLink( event ) {
		this.setState( { editLink: true } );
		event.preventDefault();
	}

	submitLink( event ) {
		const { link, value, onChange, speak } = this.props;
		const { inputValue, opensInNewWindow } = this.state;
		const url = prependHTTP( inputValue );
		const format = createLinkFormat( { url, opensInNewWindow } );

		event.preventDefault();

		if ( isCollapsed( value ) && link === undefined ) {
			const toInsert = applyFormat( create( { text: url } ), format, 0, url.length );
			onChange( insert( value, toInsert ) );
		} else {
			onChange( applyFormat( value, format ) );
		}

		if ( this.state.editLink ) {
			this.props.speak( __( 'Link edited.' ), 'assertive' );
		}

		this.resetState();

		if ( ! link ) {
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
		const { link, addingLink, value } = this.props;

		if ( ! link && ! addingLink ) {
			return null;
		}

		const { inputValue, opensInNewWindow } = this.state;
		const { url } = getLinkAttributesFromFormat( link );
		const showInput = isShowingInput( this.props, this.state );

		return (
			<Fill name="RichText.Siblings">
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
			</Fill>
		);
	}
}

export default withSpokenMessages( InlineLinkUI );
