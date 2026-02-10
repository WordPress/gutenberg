/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { Navigator } from '@wordpress/components';

/**
 * Internal dependencies
 */
import RevisionHistoryScreen from '..';
import { store } from '../../../store';

/**
 * Decorator that wraps the story in a Navigator and loads mock store data.
 */
function WithNavigatorAndData( {
	Story,
	perPage = 10,
}: {
	Story: React.ComponentType;
	perPage?: number;
} ) {
	const { fetchGuidelines, fetchRevisions } = useDispatch( store );

	useEffect( () => {
		fetchGuidelines();
		fetchRevisions( 1, 1, perPage );
	}, [ fetchGuidelines, fetchRevisions, perPage ] );

	return (
		<Navigator initialPath="/revisions">
			<Navigator.Screen path="/revisions">
				<Story />
			</Navigator.Screen>
		</Navigator>
	);
}

const meta: Meta< typeof RevisionHistoryScreen > = {
	title: 'ContentGuidelines/RevisionHistoryScreen',
	component: RevisionHistoryScreen,
	decorators: [
		( Story ) => (
			<div style={ { maxWidth: '800px' } }>
				<WithNavigatorAndData Story={ Story } />
			</div>
		),
	],
};
export default meta;

type Story = StoryObj< typeof RevisionHistoryScreen >;

/**
 * Default state with revisions loaded in a DataViews table.
 * Shows DATE, USER, and ACTIONS (kebab menu) columns.
 * The most recent revision has no "Restore" action (it's the current version).
 */
export const Default: Story = {};

/**
 * Empty state when no revisions exist.
 */
export const Empty: Story = {
	decorators: [
		( Story ) => {
			const { fetchGuidelines, resetStore } = useDispatch( store );

			useEffect( () => {
				resetStore();
				fetchGuidelines();
			}, [ fetchGuidelines, resetStore ] );

			return (
				<div style={ { maxWidth: '800px' } }>
					<Navigator initialPath="/revisions">
						<Navigator.Screen path="/revisions">
							<Story />
						</Navigator.Screen>
					</Navigator>
				</div>
			);
		},
	],
};
