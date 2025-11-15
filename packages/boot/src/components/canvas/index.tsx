/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { Spinner } from '@wordpress/components';

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
		<div
			style={ { height: '100%' } }
			// @ts-expect-error inert untyped properly.
			inert={ canvas.isPreview ? 'true' : undefined }
		>
			<Editor
				postType={ canvas.postType }
				postId={ canvas.postId }
				settings={ { isPreviewMode: canvas.isPreview } }
				backButton={ backButton }
			/>
		</div>
	);
}
