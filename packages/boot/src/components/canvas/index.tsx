import { useState, useEffect, useMemo } from '@wordpress/element';
import { Spinner as WCSpinner } from '@wordpress/components';
import { useNavigate, useSearch } from '@wordpress/route';
import { __ } from '@wordpress/i18n';
import { inertValue } from '@wordpress/react-inert-value';
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
import { unlock } from '../../lock-unlock';

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
		useNavigateToEntityRecord( canvas.postType, canvas.postId );
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
	 * Whether the route names an entity — both a post type and a post — for the
	 * editor to open. One that does not either leaves the editor to resolve the
	 * home page (see `resolvesHomePage` below) or gives it nothing to open, and
	 * either way the editor needs the block templates only a block theme has.
	 * `isBlockTheme` is `undefined` while the theme is still being read.
	 */
	const hasEntity = !! ( canvas.postType && canvas.postId );
	const isBlockTheme = useSelect(
		( select ) =>
			(
				select( coreStore ).getCurrentTheme() as
					{ is_block_theme?: boolean } | undefined
			 )?.is_block_theme,
		[]
	);

	/*
	 * Where clicking a previewed canvas goes, resolved the same way the editor
	 * resolves anywhere else it sends you to edit an entity, and whether it
	 * should go anywhere at all: a trashed entity has to be restored before it
	 * can be edited.
	 *
	 * A route that names neither a post type nor a post previews whatever the
	 * editor resolves the site's home page to — a static front page or the
	 * template that shows the front page — so clicking it edits that, resolved
	 * the same way the editor does. A route that names a post type but no post,
	 * such as the navigation list of a site with no menus, previews nothing the
	 * editor resolves, so there is nothing to edit.
	 *
	 * The records are the ones the editor loads for this canvas, so reading
	 * them here costs no request of their own. Only a block theme mounts the
	 * editor, which is why the home page is resolved for no other: on a
	 * classic theme nothing else would have fetched it.
	 */
	const resolvesHomePage = ! canvas.postType && ! canvas.postId;
	const { editLink, isTrashed } = useSelect(
		( select ) => {
			let postType: string | undefined = canvas.postType;
			let postId: string | number | undefined = canvas.postId;

			if ( resolvesHomePage ) {
				if ( ! isBlockTheme ) {
					return { editLink: undefined, isTrashed: false };
				}

				const homePage = unlock( select( coreStore ) ).getHomePage() as
					| { postType?: string; postId?: string | number }
					| null
					| undefined;
				postType = homePage?.postType;
				postId = homePage?.postId;
			}

			if ( ! postType || ! postId ) {
				return { editLink: undefined, isTrashed: false };
			}

			const record = select( coreStore ).getEntityRecord(
				'postType',
				postType,
				postId
			) as { status?: string } | undefined;

			return {
				editLink: select( bootStore ).getEntityLink( postType, postId ),
				isTrashed: record?.status === 'trash',
			};
		},
		[ canvas.postType, canvas.postId, resolvesHomePage, isBlockTheme ]
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
				<WCSpinner />
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
				inert={ inertValue( canvas.isPreview ) }
			>
				<Editor
					postType={ canvas.postType }
					postId={ canvas.postId }
					renderingMode={ canvas.renderingMode }
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
