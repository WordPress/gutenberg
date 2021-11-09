/**
 * Internal dependencies
 */
import { useCx } from '..';
import StyleProvider from '../../../style-provider';

/**
 * WordPress dependencies
 */
import { useState, createPortal } from '@wordpress/element';
/**
 * External dependencies
 */
import { css } from '@emotion/react';

export default {
	title: 'Components (Experimental)/useCx',
};

const IFrame = ( { children } ) => {
	const [ iframeDocument, setIframeDocument ] = useState();

	const handleRef = ( node ) => {
		if ( ! node ) {
			return null;
		}

		function setIfReady() {
			const { contentDocument } = node;
			const { readyState } = contentDocument;

			if ( readyState !== 'interactive' && readyState !== 'complete' ) {
				return false;
			}

			setIframeDocument( contentDocument );
		}

		if ( setIfReady() ) {
			return;
		}

		node.addEventListener( 'load', () => {
			// iframe isn't immediately ready in Firefox
			setIfReady();
		} );
	};

	return (
		<iframe ref={ handleRef } title="use-cx-test-frame">
			{ iframeDocument &&
				createPortal(
					<StyleProvider document={ iframeDocument }>
						{ children }
					</StyleProvider>,
					iframeDocument.body
				) }
		</iframe>
	);
};

const Example = ( { args, children } ) => {
	const cx = useCx();
	const classes = cx( ...args );
	return <span className={ classes }>{ children }</span>;
};

export const _default = () => {
	const redText = css`
		color: red;
	`;
	return (
		<IFrame>
			<Example args={ [ redText ] }>
				This text is inside an iframe and is red!
			</Example>
		</IFrame>
	);
};
