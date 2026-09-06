import { useState, useEffect, useMemo } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { useNavigate, useSearch } from '@wordpress/route';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as bootStore } from '../../store';
import type { CanvasData } from '../../store/types';
import BootBackButton from './back-button';
import SitePreview from './site-preview';
import useNavigateToEntityRecord, {
	useActionPerformed,
} from './use-navigate-to-entity-record';
import { getDeviceType } from './viewport';

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
	const { onNavigateToEntityRecord, onNavigateToPreviousEntityRecord } =
		useNavigateToEntityRecord();
	const onActionPerformed = useActionPerformed( canvas.postType );

	/*
	 * An entity can be asked to be edited at a particular width — a navigation
	 * overlay meant for mobile — and carries the width it was left at when
	 * returned to. Anything else opens at the default.
	 */
	const viewport = useSearch( {
		strict: false,
		select: ( search ) => ( search as { viewport?: string } ).viewport,
	} ) as string | undefined;

	/*
	 * Where clicking a previewed canvas goes, resolved the same way the editor
	 * resolves anywhere else it sends you to edit an entity, and whether it
	 * should go anywhere at all: a trashed entity has to be restored before it
	 * can be edited.
	 *
	 * The record is the one the editor loads for this canvas, so reading it
	 * here costs no request of its own.
	 */
	/*
	 * A route that names no entity leaves the editor to resolve one, which it
	 * does from the block templates only a block theme has. `undefined` while
	 * the theme is still being read.
	 */
	const hasEntity = !! ( canvas.postType && canvas.postId );
	const isBlockTheme = useSelect(
		( select ) =>
			(
				select( coreStore ).getCurrentTheme() as
					| { is_block_theme?: boolean }
					| undefined
			 )?.is_block_theme,
		[]
	);

	const { editLink, isTrashed } = useSelect(
		( select ) => {
			if ( ! canvas.postType || ! canvas.postId ) {
				return { editLink: undefined, isTrashed: false };
			}

			const record = select( coreStore ).getEntityRecord(
				'postType',
				canvas.postType,
				canvas.postId
			) as { status?: string } | undefined;

			return {
				editLink: select( bootStore ).getEntityLink(
					canvas.postType,
					canvas.postId
				),
				isTrashed: record?.status === 'trash',
			};
		},
		[ canvas.postType, canvas.postId ]
	);

	/*
	 * Memoized because the editor provider pushes these settings into the store
	 * whenever their identity changes, and the callbacks have to stay stable for
	 * the block inspector to keep offering the same affordance.
	 */
	const settings = useMemo(
		() => ( {
			isPreviewMode: canvas.isPreview,
			styles: canvas.isPreview
				? [ { css: 'body{min-height:100vh;}' } ]
				: [],
			onNavigateToEntityRecord,
			onNavigateToPreviousEntityRecord,
		} ),
		[
			canvas.isPreview,
			onNavigateToEntityRecord,
			onNavigateToPreviousEntityRecord,
		]
	);

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

	// Nothing for the editor to open, so show the site the route configures.
	if ( ! hasEntity && isBlockTheme === false ) {
		return <SitePreview />;
	}

	// Show spinner while loading the editor module, and until it is known which
	// of the two this canvas is, so the wrong one is never shown first.
	if ( ! Editor || ( ! hasEntity && isBlockTheme === undefined ) ) {
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
					settings={ settings }
					backButton={ backButton }
					onActionPerformed={ onActionPerformed }
					initialViewport={ getDeviceType( viewport ) }
				/>
			</div>
			{ canvas.isPreview && editLink && (
				<div
					onClick={
						isTrashed
							? undefined
							: () => navigate( { to: editLink } )
					}
					onKeyDown={ ( e ) => {
						if ( isTrashed ) {
							return;
						}
						if ( e.key === 'Enter' || e.key === ' ' ) {
							e.preventDefault();
							navigate( { to: editLink } );
						}
					} }
					style={ {
						position: 'absolute',
						inset: 0,
						cursor: isTrashed ? 'default' : 'pointer',
						zIndex: 1,
					} }
					role="button"
					tabIndex={ 0 }
					aria-disabled={ isTrashed }
					aria-label={ __( 'Edit' ) }
				/>
			) }
		</div>
	);
}
