/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';

export default class FileBlockEditableLink extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			showPlaceholder: ! this.props.text,
		};
	}

	componentDidUpdate( prevProps ) {
		if ( prevProps.text !== this.props.text ) {
			this.setState( { showPlaceholder: ! this.props.text } );
		}
	}

	render() {
		const { className, placeholder, text, href, updateFileName } = this.props;
		const { showPlaceholder } = this.state;

		const copyLinkToClipboard = ( e ) => {
			const selectedText = document.getSelection().toString();
			const htmlLink = `<a href="${ href }">${ selectedText }</a>`;
			e.clipboardData.setData( 'text/plain', selectedText );
			e.clipboardData.setData( 'text/html', htmlLink );
		};

		const forcePlainTextPaste = ( e ) => {
			e.preventDefault();

			const selection = document.getSelection();
			const clipboard =
				e.clipboardData.getData( 'text/plain' ).replace( /[\n\r]/g, '' );
			const textNode = document.createTextNode( clipboard );

			selection.getRangeAt( 0 ).insertNode( textNode );
			selection.collapseToEnd();
		};

		const showPlaceholderIfEmptyString = ( e ) => {
			if ( e.target.innerText === '' ) {
				this.setState( { showPlaceholder: true } );
			} else {
				this.setState( { showPlaceholder: false } );
			}
		};

		return (
			<Fragment>
				<a
					aria-label={ placeholder }
					className={ `${ className }__textlink` }
					contentEditable={ true }
					href={ href }
					onBlur={ ( e ) => updateFileName( e.target.innerText ) }
					onInput={ showPlaceholderIfEmptyString }
					onCopy={ copyLinkToClipboard }
					onCut={ copyLinkToClipboard }
					onPaste={ forcePlainTextPaste }
				>
					{ text }
				</a>
				{ showPlaceholder &&
					// Disable reason: Only useful for mouse users
					/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
					<span
						className={ `${ className }__textlink-placeholder` }
						onClick={ ( e ) => e.target.previousSibling.focus() }
					>
						{ placeholder }
					</span>
					/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
				}
			</Fragment>
		);
	}
}
