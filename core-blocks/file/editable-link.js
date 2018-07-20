/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { RichText } from '@wordpress/editor';

export default class FileBlockEditableLink extends Component {
	constructor() {
		super( ...arguments );

		this.copyLinkToClipboard = this.copyLinkToClipboard.bind( this );
	}

	copyLinkToClipboard( event ) {
		const selectedText = document.getSelection().toString();
		const htmlLink = `<a href="${ this.props.href }">${ selectedText }</a>`;
		event.clipboardData.setData( 'text/plain', selectedText );
		event.clipboardData.setData( 'text/html', htmlLink );
	}

	forcePlainTextPaste( event ) {
		event.preventDefault();

		const selection = document.getSelection();
		const clipboard = event.clipboardData.getData( 'text/plain' ).replace( /[\n\r]/g, '' );
		const textNode = document.createTextNode( clipboard );

		selection.getRangeAt( 0 ).insertNode( textNode );
		selection.collapseToEnd();
	}

	render() {
		const { className, placeholder, text, href, updateFileName } = this.props;

		return (
			<Fragment>
				<a
					aria-label={ placeholder }
					className={ `${ className }__textlink` }
					href={ href }
					onCopy={ this.copyLinkToClipboard }
					onCut={ this.copyLinkToClipboard }
					onPaste={ this.forcePlainTextPaste }
				>
					<RichText
						wrapperClassName={ `${ className }__textlink-richtext` }
						tagName="div" // must be block-level or else cursor disappears
						value={ text }
						multiline="false"
						placeholder={ placeholder }
						keepPlaceholderOnFocus
						formattingControls={ [] } // disable controls
						onChange={ ( fileName ) => updateFileName( fileName ) }
					/>
				</a>
			</Fragment>
		);
	}
}
