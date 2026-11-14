import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { screen } from '@testing-library/react';
import { useState } from '@wordpress/element';
import { Dropdown, SlotFillProvider, withFilters } from '@wordpress/components';
import '@wordpress/theme/design-tokens.css';
import type { ComponentProps } from 'react';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { ActionModal } from '../dataviews-item-actions';
import CompatibleModal from '../compatible-modal';

function Demo( props: Partial< ComponentProps< typeof CompatibleModal > > ) {
	const [ open, setOpen ] = useState( false );
	return (
		<SlotFillProvider>
			<button onClick={ () => setOpen( true ) }>Open modal</button>
			{ open && (
				<CompatibleModal
					useUiOverlay
					children={ null }
					title="Compatible modal"
					onRequestClose={ () => setOpen( false ) }
					{ ...props }
				/>
			) }
		</SlotFillProvider>
	);
}

describe( 'Compatible modal', () => {
	it.each( [ false, true ] )(
		'preserves content focus with native host %s',
		async ( useUiOverlay ) => {
			await render(
				<Demo
					useUiOverlay={ useUiOverlay }
					focusOnMount="firstContentElement"
				>
					<button>First content</button>
				</Demo>
			);
			const user = userEvent.setup();
			await user.click(
				screen.getByRole( 'button', { name: 'Open modal' } )
			);
			await expect
				.element(
					screen.getByRole( 'button', { name: 'First content' } )
				)
				.toHaveFocus();
		}
	);
	it.each( [ false, true ] )(
		'falls back to the header with native host %s',
		async ( useUiOverlay ) => {
			await render(
				<Demo
					useUiOverlay={ useUiOverlay }
					focusOnMount="firstContentElement"
				>
					<p>Text only</p>
				</Demo>
			);
			await userEvent.click(
				screen.getByRole( 'button', { name: 'Open modal' } )
			);
			await expect
				.element( screen.getByRole( 'button', { name: 'Close' } ) )
				.toHaveFocus();
		}
	);
	it( 'focuses the frame when content and header have no controls', async () => {
		await render(
			<Demo __experimentalHideHeader focusOnMount="firstContentElement">
				<p>Text only</p>
			</Demo>
		);
		await userEvent.click(
			screen.getByRole( 'button', { name: 'Open modal' } )
		);
		await expect
			.element(
				screen.getByRole( 'dialog', { name: 'Compatible modal' } )
			)
			.toHaveFocus();
	} );
	it( 'keeps a slotted legacy popup accessible within the dialog', async () => {
		await render(
			<Demo>
				<Dropdown
					renderToggle={ ( { onToggle } ) => (
						<button onClick={ onToggle }>Open nested popup</button>
					) }
					renderContent={ ( { onClose } ) => (
						<button onClick={ onClose }>
							Choose nested option
						</button>
					) }
				/>
			</Demo>
		);
		const user = userEvent.setup();
		await user.click(
			screen.getByRole( 'button', { name: 'Open modal' } )
		);
		await user.click(
			screen.getByRole( 'button', { name: 'Open nested popup' } )
		);
		const option = screen.getByRole( 'button', {
			name: 'Choose nested option',
		} );
		await expect.element( option ).toHaveFocus();
		expect(
			screen.getByRole( 'dialog', { name: 'Compatible modal' } )
		).toContainElement( option );
		await user.keyboard( '{Escape}' );
		await expect
			.element(
				screen.getByRole( 'button', { name: 'Open nested popup' } )
			)
			.toHaveFocus();
		expect(
			screen.getByRole( 'dialog', { name: 'Compatible modal' } )
		).toBeVisible();
		await user.keyboard( '{Escape}' );
		await expect
			.element( screen.getByRole( 'button', { name: 'Open modal' } ) )
			.toHaveFocus();
	} );
} );

it( 'downgrades an action host when its actual filtered renderer loses support', async () => {
	const hook = 'test.actionOverlay';
	const Replacement = () => (
		<Dropdown
			renderToggle={ ( { onToggle } ) => (
				<button onClick={ onToggle }>Open replacement popup</button>
			) }
			renderContent={ () => <button>Replacement option</button> }
		/>
	);
	const Original = Object.assign(
		() => (
			<button
				onClick={ () =>
					addFilter( hook, 'test/replace', () => Replacement )
				}
			>
				Replace action
			</button>
		),
		{ supportsUiOverlays: true }
	);
	const RenderModal = withFilters( hook )(
		Original
	) as unknown as typeof Original;
	try {
		await render(
			<SlotFillProvider>
				<ActionModal
					action={ { id: 'test', label: 'Test action', RenderModal } }
					items={ [] }
					closeModal={ () => {} }
				/>
			</SlotFillProvider>
		);
		await userEvent.click(
			screen.getByRole( 'button', { name: 'Replace action' } )
		);
		await userEvent.click(
			await screen.findByRole( 'button', {
				name: 'Open replacement popup',
			} )
		);
		await expect
			.element(
				screen.getByRole( 'button', { name: 'Replacement option' } )
			)
			.toHaveFocus();
	} finally {
		removeFilter( hook, 'test/replace' );
	}
} );
