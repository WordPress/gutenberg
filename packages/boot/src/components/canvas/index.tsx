/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { useNavigate } from '@wordpress/route';

/**
 * Internal dependencies
 */
import type { CanvasData } from '../../store/types';
import BootBackButton from './back-button';

interface CanvasProps {
	canvas: CanvasData;
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
	const navigate = useNavigate();

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
					settings={ { isPreviewMode: canvas.isPreview } }
					backButton={ backButton }
				/>
			</div>
			{ canvas.isPreview && canvas.editLink && (
				<div
					onClick={ () => navigate( { to: canvas.editLink } ) }
					onKeyDown={ ( e ) => {
						if ( e.key === 'Enter' || e.key === ' ' ) {
							e.preventDefault();
							navigate( { to: canvas.editLink } );
						}
					} }
					style={ {
						position: 'absolute',
						inset: 0,
						cursor: 'pointer',
						zIndex: 1,
					} }
					role="button"
					tabIndex={ 0 }
					aria-label="Click to edit"
				/>
			) }
		</div>
	);
}
