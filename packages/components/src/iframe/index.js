/**
 * WordPress dependencies
 */
import { useState, createPortal, forwardRef } from '@wordpress/element';
import { useMergeRefs, useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import StyleProvider from '../style-provider';

function Iframe( { contentRef, children, head, title, ...props }, ref ) {
	const [ iframeDocument, setIframeDocument ] = useState();
	const refEffect = useRefEffect( ( node ) => {
		function setDocumentIfReady() {
			const { contentDocument } = node;
			const { readyState, body } = contentDocument;

			if ( readyState !== 'interactive' && readyState !== 'complete' ) {
				return false;
			}

			if ( typeof contentRef === 'function' ) {
				contentRef( body );
			} else if ( contentRef ) {
				contentRef.current = body;
			}

			setIframeDocument( contentDocument );

			return true;
		}

		if ( setDocumentIfReady() ) {
			return;
		}

		// Document is not immediately loaded in Firefox.
		node.addEventListener( 'load', () => {
			setDocumentIfReady();
		} );
	}, [] );

	head = (
		<>
			<style>{ 'body{margin:0}' }</style>
			{ head }
		</>
	);

	return (
		<iframe
			{ ...props }
			ref={ useMergeRefs( [ ref, refEffect ] ) }
			title={ title }
		>
			{ iframeDocument &&
				createPortal(
					<StyleProvider document={ iframeDocument }>
						{ children }
					</StyleProvider>,
					iframeDocument.body
				) }
			{ iframeDocument && createPortal( head, iframeDocument.head ) }
		</iframe>
	);
}

export default forwardRef( Iframe );
