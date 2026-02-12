/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { Navigator } from '@wordpress/components';
import { useState, useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import type { GuidelineCategories, Revision } from './types';
import ActionsSection from './components/actions-section';
import RevisionHistoryScreen from './components/revision-history-screen';
import './style.scss';

function HomeScreen( {
	guidelines,
	onImport,
}: {
	guidelines: GuidelineCategories | null;
	onImport: ( categories: GuidelineCategories ) => void;
} ) {
	return (
		<div className="content-guidelines__content">
			<ActionsSection guidelines={ guidelines } onImport={ onImport } />
		</div>
	);
}

function ContentGuidelinesPage() {
	const [ guidelines, setGuidelines ] =
		useState< GuidelineCategories | null >( null );
	const [ revisions, setRevisions ] = useState<
		Array< Revision & { categories: GuidelineCategories } >
	>( [] );
	const [ currentRevisionId, setCurrentRevisionId ] = useState<
		number | null
	>( null );
	const { createSuccessNotice } = useDispatch( noticesStore );
	const currentUser = useSelect(
		( select ) => select( coreStore ).getCurrentUser(),
		[]
	);

	const handleImport = useCallback(
		( categories: GuidelineCategories ) => {
			const id = Date.now();
			setGuidelines( categories );
			setCurrentRevisionId( id );
			setRevisions( ( prev ) => [
				{
					id,
					date: new Date().toISOString(),
					author_name: currentUser?.name || __( 'User' ),
					categories,
				},
				...prev,
			] );
			createSuccessNotice(
				__( 'Content guidelines imported successfully.' ),
				{ type: 'snackbar' }
			);
		},
		[ createSuccessNotice, currentUser ]
	);

	const handleRestore = useCallback(
		( revisionId: number, categories: GuidelineCategories ) => {
			setGuidelines( categories );
			setCurrentRevisionId( revisionId );
			createSuccessNotice( __( 'Revision restored successfully.' ), {
				type: 'snackbar',
			} );
		},
		[ createSuccessNotice ]
	);

	return (
		<Page
			title={ __( 'Content guidelines' ) }
			subTitle={ __(
				"Set content standards that guide your team, inform plugins, and help AI tools generate content that matches your site's voice and requirements."
			) }
		>
			<Navigator initialPath="/">
				<Navigator.Screen path="/">
					<HomeScreen
						guidelines={ guidelines }
						onImport={ handleImport }
					/>
				</Navigator.Screen>

				<Navigator.Screen path="/revisions">
					<RevisionHistoryScreen
						revisions={ revisions }
						currentRevisionId={ currentRevisionId }
						onRestore={ handleRestore }
					/>
				</Navigator.Screen>
			</Navigator>
		</Page>
	);
}

export const stage = ContentGuidelinesPage;
