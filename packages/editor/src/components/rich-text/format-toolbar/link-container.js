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

/**
 * Internal dependencies
 */
import PositionedAtSelection from './positioned-at-selection';
import URLInput from '../../url-input';
import { filterURLForDisplay } from '../../../utils/url';
import URLPopover from '../../url-popover';

const stopKeyPropagation = ( event ) => event.stopPropagation();

function getLinkAttributesFromFormat( { attributes: { href = '', target } = {} } = {} ) {
	return { href, target };
}

/**
 * Generates the format object that will be applied to the link text.
 *
 * @param {string}  href             The href of the link.
 * @param {boolean} opensInNewWindow Whether this link will open in a new window.
 * @param {Object}  record           The object that contains the text being wrapped in the a tag.
 *
 * @return {Object} The final format object.
 */
function createLinkFormat( { href, opensInNewWindow, record } ) {
	const format = {
		type: 'a',
		attributes: {
			href,
		},
	};

	const text = record.text || '';

	if ( opensInNewWindow ) {
		format.attributes.target = '_blank';
		format.attributes.rel = 'noreferrer noopener';
		format.attributes[ 'aria-label' ] = `${ text } (opens in a new tab)`;
	}

	return format;
}

function isShowingInput( props, state ) {
	return props.addingLink || state.editLink;
}

const LinkEditor = ( { inputValue, onChangeInputValue, onKeyDown, submitLink, autocompleteRef } ) => (
	// Disable reason: KeyPress must be suppressed so the block doesn't hide the toolbar
	/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
	<form
		className="editor-format-toolbar__link-container-content"
		onKeyPress={ stopKeyPropagation }
		onKeyDown={ onKeyDown }
		onSubmit={ submitLink }
	>
		<URLInput
			value={ inputValue }
			onChange={ onChangeInputValue }
			autocompleteRef={ autocompleteRef }
		/>
		<IconButton icon="editor-break" label={ __( 'Apply' ) } type="submit" />
	</form>
	/* eslint-enable jsx-a11y/no-noninteractive-element-interactions */
);

const LinkViewer = ( { href, editLink } ) => (
	// Disable reason: KeyPress must be suppressed so the block doesn't hide the toolbar
	/* eslint-disable jsx-a11y/no-static-element-interactions */
	<div
		className="editor-format-toolbar__link-container-content"
		onKeyPress={ stopKeyPropagation }
	>
		<ExternalLink
			className="editor-format-toolbar__link-container-value"
			href={ href }
		>
			{ filterURLForDisplay( safeDecodeURI( href ) ) }
		</ExternalLink>
		<IconButton icon="edit" label={ __( 'Edit' ) } onClick={ editLink } />
	</div>
	/* eslint-enable jsx-a11y/no-static-element-interactions */
);

class LinkContainer extends Component {
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
		const { href, target } = getLinkAttributesFromFormat( props.link );
		const opensInNewWindow = target === '_blank';

		if ( ! isShowingInput( props, state ) ) {
			if ( href !== state.inputValue ) {
				return { inputValue: href };
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
		this.setState( { opensInNewWindow } );

		// Apply now if URL is not being edited.
		if ( ! isShowingInput( this.props, this.state ) ) {
			const { href } = getLinkAttributesFromFormat( this.props.link );
			const { record } = this.props;
			this.props.applyFormat( createLinkFormat( { href, opensInNewWindow, record } ) );
		}
	}

	editLink( event ) {
		this.setState( { editLink: true } );
		event.preventDefault();
	}

	submitLink( event ) {
		const { link, record } = this.props;
		const { inputValue, opensInNewWindow } = this.state;
		const href = prependHTTP( inputValue );
		const format = createLinkFormat( { href, opensInNewWindow, record } );

		if ( isCollapsed( record ) && link === undefined ) {
			const toInsert = applyFormat( create( { text: href } ), format, 0, href.length );
			this.props.onChange( insert( record, toInsert ) );
		} else {
			this.props.applyFormat( format );
		}

		if ( this.state.editLink ) {
			this.props.speak( __( 'Link edited.' ), 'assertive' );
		}

		this.resetState();

		if ( ! link ) {
			this.props.speak( __( 'Link added.' ), 'assertive' );
		}

		event.preventDefault();
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
		const { link, addingLink, record } = this.props;

		if ( ! link && ! addingLink ) {
			return null;
		}

		const { inputValue, opensInNewWindow } = this.state;
		const { href } = getLinkAttributesFromFormat( link );
		const showInput = isShowingInput( this.props, this.state );

		return (
			<Fill name="RichText.Siblings">
				<PositionedAtSelection
					key={ `${ record.start }${ record.end }` /* Used to force rerender on selection change */ }
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
								inputValue={ inputValue }
								onChangeInputValue={ this.onChangeInputValue }
								onKeyDown={ this.onKeyDown }
								submitLink={ this.submitLink }
								autocompleteRef={ this.autocompleteRef }
							/>
						) : (
							<LinkViewer
								href={ href }
								editLink={ this.editLink }
							/>
						) }
					</URLPopover>
				</PositionedAtSelection>
			</Fill>
		);
	}
}

export default withSpokenMessages( LinkContainer );
