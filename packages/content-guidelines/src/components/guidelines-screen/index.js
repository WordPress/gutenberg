/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import {
	TabPanel,
	Spinner,
	Notice,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../../store';
import Header from './header';
import Sidebar from './sidebar';
import PreviewCanvas from './preview-canvas';
import HistoryPanel from '../history';
import './style.scss';

/**
 * Main guidelines screen component.
 *
 * @return {JSX.Element} The guidelines screen.
 */
export default function GuidelinesScreen() {
	const [ showHistory, setShowHistory ] = useState( false );
	const [ fixturePostId, setFixturePostId ] = useState( null );

	const {
		active,
		draft,
		hasDraft,
		hasGuidelines,
		isSaving,
		isPublishing,
		error,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		return {
			active: store.getActive(),
			draft: store.getDraft(),
			hasDraft: store.hasDraft(),
			hasGuidelines: store.hasGuidelines(),
			isSaving: store.isSaving(),
			isPublishing: store.isPublishing(),
			error: store.getError(),
		};
	}, [] );

	const { initializeEditor, setError: clearError } = useDispatch( STORE_NAME );

	// Initialize editor when guidelines load.
	useEffect( () => {
		if ( active && ! draft ) {
			initializeEditor();
		}
	}, [ active, draft, initializeEditor ] );

	// Loading state.
	const isLoading = active === undefined;

	if ( isLoading ) {
		return (
			<div className="content-guidelines-screen content-guidelines-screen--loading">
				<Spinner />
				<p>{ __( 'Loading guidelines...', 'content-guidelines' ) }</p>
			</div>
		);
	}

	return (
		<div className="content-guidelines-screen">
			<Header
				hasDraft={ hasDraft }
				isSaving={ isSaving }
				isPublishing={ isPublishing }
				onShowHistory={ () => setShowHistory( true ) }
			/>

			{ error && (
				<Notice
					status="error"
					isDismissible
					onDismiss={ () => clearError( null ) }
				>
					{ error }
				</Notice>
			) }

			<div className="content-guidelines-screen__content">
				<div className="content-guidelines-screen__preview">
					<PreviewCanvas
						postId={ fixturePostId }
						onPostSelect={ setFixturePostId }
					/>
				</div>

				<div className="content-guidelines-screen__sidebar">
					<Sidebar
						fixturePostId={ fixturePostId }
						hasGuidelines={ hasGuidelines }
					/>
				</div>
			</div>

			{ showHistory && (
				<HistoryPanel onClose={ () => setShowHistory( false ) } />
			) }
		</div>
	);
}
