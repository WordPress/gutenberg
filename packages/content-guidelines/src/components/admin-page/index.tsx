/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { Spinner, Notice, Navigator } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store } from '../../store';
import ActionsSection from '../actions-section';
import RevisionHistoryScreen from '../revision-history-screen';

export default function AdminPage() {
	const { isLoadingData, error } = useSelect( ( select ) => {
		const storeSelectors = select( store );
		return {
			isLoadingData: storeSelectors.isLoading(),
			error: storeSelectors.getError(),
		};
	}, [] );

	const { fetchGuidelines } = useDispatch( store );

	useEffect( () => {
		fetchGuidelines();
	}, [ fetchGuidelines ] );

	if ( isLoadingData ) {
		return (
			<div className="content-guidelines-admin content-guidelines-admin--loading">
				<Spinner />
				<p>{ __( 'Loading guidelines…' ) }</p>
			</div>
		);
	}

	return (
		<div className="content-guidelines-admin">
			<header className="content-guidelines-admin__header">
				<h1 className="wp-heading-inline">
					{ __( 'Content Guidelines' ) }
				</h1>
				<p className="description">
					{ __(
						"Set content standards that guide your team, inform plugins, and help AI tools generate content that matches your site's voice and requirements."
					) }
				</p>
			</header>

			{ error && (
				<Notice status="error" isDismissible={ false }>
					{ error }
				</Notice>
			) }

			<Navigator initialPath="/">
				<Navigator.Screen path="/">
					<ActionsSection />
				</Navigator.Screen>

				<Navigator.Screen path="/revisions">
					<RevisionHistoryScreen />
				</Navigator.Screen>
			</Navigator>
		</div>
	);
}
