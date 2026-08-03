/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { RawHTML, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { RenderBlocks } from './types';
import styles from './ssr-fallback-block.module.css';

interface SsrFallbackBlockProps {
	/* Comment-delimited markup for a single block with no admin component. */
	markup: string;

	/* Per-instance values, forwarded so bindings resolve against the instance. */
	attributes: Record< string, unknown >;

	/* Host-provided resolution of markup to HTML. */
	renderBlocks?: RenderBlocks;
}

/*
 * Renders one block that has no admin (React) representation: resolves its
 * markup through `renderBlocks` and injects the HTML, inert, into the tree.
 * Renders nothing when the caller supplies no `renderBlocks`.
 */
export function SsrFallbackBlock( {
	markup,
	attributes,
	renderBlocks,
}: SsrFallbackBlockProps ): ReactNode {
	const [ rendered, setRendered ] = useState( '' );
	const [ hasFailed, setHasFailed ] = useState( false );

	useEffect( () => {
		if ( ! markup || ! renderBlocks ) {
			return;
		}

		let cancelled = false;
		setHasFailed( false );

		renderBlocks( markup, attributes )
			.then( ( html ) => {
				if ( ! cancelled ) {
					setRendered( html );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setHasFailed( true );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [ markup, attributes, renderBlocks ] );

	if ( hasFailed ) {
		/* Generic: the copy must not leak how the widget is stored. */
		return <p role="alert">{ __( 'Could not display this widget.' ) }</p>;
	}

	if ( ! rendered ) {
		return null;
	}

	/*
	 * The class lands on RawHTML's own div: one box, not two, so a composition
	 * can size itself against the host's content area.
	 */
	return <RawHTML className={ styles.root }>{ rendered }</RawHTML>;
}
