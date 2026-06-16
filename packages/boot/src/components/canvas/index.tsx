/**
 * External dependencies
 */
import type { SyntheticEvent } from 'react';

/**
 * WordPress dependencies
 */
import { useState, useEffect, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { Button, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';
import { useNavigate } from '@wordpress/route';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import type { CanvasData } from '../../store/types';
import BootBackButton from './back-button';

interface CanvasProps {
	canvas: CanvasData;
}

interface CanvasEditButtonProps {
	editLink?: string;
	isResolving?: boolean;
}

interface PreviewLinkResponse {
	editLink?: string;
}

function CanvasEditButton( { editLink, isResolving }: CanvasEditButtonProps ) {
	const navigate = useNavigate();

	if ( ! editLink && ! isResolving ) {
		return null;
	}

	return (
		<div
			style={ {
				position: 'absolute',
				top: '16px',
				right: '16px',
				zIndex: 2,
			} }
		>
			<Button
				variant="primary"
				icon={ pencil }
				disabled={ ! editLink || isResolving }
				accessibleWhenDisabled
				__next40pxDefaultSize
				onClick={ () => {
					if ( editLink ) {
						navigate( { to: editLink } );
					}
				} }
			>
				{ __( 'Edit' ) }
			</Button>
		</div>
	);
}

function FrontendPreviewCanvas( { canvas }: CanvasProps ) {
	const [ currentEditLink, setCurrentEditLink ] = useState( canvas.editLink );
	const [ isResolving, setIsResolving ] = useState( false );

	useEffect( () => {
		setCurrentEditLink( canvas.editLink );
	}, [ canvas.editLink, canvas.previewUrl ] );

	const resolveEditLink = useCallback(
		async ( url?: string ) => {
			if ( ! url ) {
				setCurrentEditLink( canvas.editLink );
				return;
			}

			setIsResolving( true );

			try {
				const response = await apiFetch< PreviewLinkResponse >( {
					path: addQueryArgs(
						'/gutenberg/v1/site-editor-preview-link',
						{ url }
					),
				} );

				setCurrentEditLink( response.editLink || canvas.editLink );
			} catch {
				setCurrentEditLink( canvas.editLink );
			} finally {
				setIsResolving( false );
			}
		},
		[ canvas.editLink ]
	);

	const handleLoad = useCallback(
		( event: SyntheticEvent< HTMLIFrameElement > ) => {
			let currentUrl = canvas.previewUrl;

			try {
				currentUrl =
					event.currentTarget.contentWindow?.location.href ||
					currentUrl;
			} catch {
				currentUrl = canvas.previewUrl;
			}

			resolveEditLink( currentUrl );
		},
		[ canvas.previewUrl, resolveEditLink ]
	);

	return (
		<div style={ { height: '100%', position: 'relative' } }>
			<iframe
				title={ __( 'Site preview' ) }
				src={ canvas.previewUrl }
				onLoad={ handleLoad }
				style={ {
					width: '100%',
					height: '100%',
					border: 0,
					display: 'block',
					background: '#fff',
				} }
			/>
			<CanvasEditButton
				editLink={ currentEditLink }
				isResolving={ isResolving }
			/>
		</div>
	);
}

/**
 * Canvas component that dynamically loads and renders the lazy editor.
 *
 * @param {Object} props        - Component props
 * @param {Object} props.canvas - Canvas data containing postType and postId
 * @return Canvas surface with editor
 */
export default function Canvas( { canvas }: CanvasProps ) {
	const [ Editor, setEditor ] = useState< any >( null );

	useEffect( () => {
		// Dynamically import the lazy-editor module
		import( '@wordpress/lazy-editor' )
			.then( ( module ) => {
				setEditor( () => module.Editor );
			} )
			.catch( ( error ) => {
				// eslint-disable-next-line no-console
				console.error( 'Failed to load lazy editor:', error );
			} );
	}, [] );

	if ( canvas.isPreview && canvas.previewUrl ) {
		return <FrontendPreviewCanvas canvas={ canvas } />;
	}

	// Show spinner while loading the editor module
	if ( ! Editor ) {
		return (
			<div
				style={ {
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100%',
					padding: '2rem',
				} }
			>
				<Spinner />
			</div>
		);
	}

	// Render back button in full-screen mode (when not preview)
	// Uses render prop pattern to receive fillProps from Slot
	const backButton = ! canvas.isPreview
		? ( { length }: { length: number } ) => (
				<BootBackButton length={ length } />
		  )
		: undefined;

	// Render the editor with canvas data
	return (
		<div style={ { height: '100%', position: 'relative' } }>
			<div
				style={ { height: '100%' } }
				// @ts-expect-error inert not typed properly
				inert={ canvas.isPreview ? 'true' : undefined }
			>
				<Editor
					postType={ canvas.postType }
					postId={ canvas.postId }
					settings={ {
						isPreviewMode: canvas.isPreview,
						disableStartPageOptions: canvas.skipStartPageOptions,
						styles: canvas.isPreview
							? [ { css: 'body{min-height:100vh;}' } ]
							: [],
					} }
					backButton={ backButton }
				/>
			</div>
			{ canvas.isPreview && (
				<CanvasEditButton editLink={ canvas.editLink } />
			) }
		</div>
	);
}
