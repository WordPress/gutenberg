/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ActionsSection from '..';
import { store } from '../../../store';

/**
 * Decorator that initialises the content-guidelines store with mock data.
 */
function WithMockGuidelines( { Story }: { Story: React.ComponentType } ) {
	const { fetchGuidelines, fetchRevisions } = useDispatch( store );

	useEffect( () => {
		fetchGuidelines();
		fetchRevisions( 1, 1, 5 );
	}, [ fetchGuidelines, fetchRevisions ] );

	return <Story />;
}

const meta: Meta< typeof ActionsSection > = {
	title: 'ContentGuidelines/ActionsSection',
	component: ActionsSection,
	decorators: [
		( Story ) => (
			<div style={ { maxWidth: '660px' } }>
				<WithMockGuidelines Story={ Story } />
			</div>
		),
	],
};
export default meta;

type Story = StoryObj< typeof ActionsSection >;

/**
 * Default state with guidelines loaded.
 * Import uploads a JSON file, Export downloads one, and View history is enabled.
 */
export const Default: Story = {};

/**
 * State before guidelines have been fetched.
 * Export and View history buttons are disabled.
 */
export const NoGuidelines: Story = {
	decorators: [
		( Story ) => {
			const { resetStore } = useDispatch( store );

			useEffect( () => {
				resetStore();
			}, [ resetStore ] );

			return (
				<div style={ { maxWidth: '660px' } }>
					<Story />
				</div>
			);
		},
	],
};

/**
 * Simulates an import validation error by programmatically triggering the
 * file input with an invalid JSON file.
 */
export const ImportError: Story = {
	decorators: [
		( Story ) => {
			const [ ready, setReady ] = useState( false );

			useEffect( () => {
				// Wait for the component to mount and the store to hydrate.
				const timer = setTimeout( () => setReady( true ), 400 );
				return () => clearTimeout( timer );
			}, [] );

			useEffect( () => {
				if ( ! ready ) {
					return;
				}

				// Find the hidden file input and simulate a change event
				// with an invalid JSON payload.
				const fileInput = document.querySelector(
					'input[type="file"][accept*=".json"]'
				) as HTMLInputElement | null;

				if ( ! fileInput ) {
					return;
				}

				const invalidJson = JSON.stringify( {
					version: '2.0',
					unexpected: true,
				} );
				const file = new File( [ invalidJson ], 'bad-import.json', {
					type: 'application/json',
				} );

				const dataTransfer = new DataTransfer();
				dataTransfer.items.add( file );
				fileInput.files = dataTransfer.files;

				fileInput.dispatchEvent(
					new Event( 'change', { bubbles: true } )
				);
			}, [ ready ] );

			return <Story />;
		},
	],
};
