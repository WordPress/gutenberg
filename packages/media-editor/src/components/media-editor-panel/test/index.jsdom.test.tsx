import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Slot, SlotFillProvider } from '@wordpress/components';
import { useState } from '@wordpress/element';
import MediaEditorPanel, {
	MediaEditorPanelsProvider,
	getPanelSlotName,
	useMediaEditorPanels,
} from '..';

function Editor( { children }: { children: React.ReactNode } ) {
	const { panels, contextValue } = useMediaEditorPanels();
	return (
		<SlotFillProvider>
			<MediaEditorPanelsProvider value={ contextValue }>
				<output data-testid="tabs">
					{ panels.map( ( panel ) => panel.name ).join( ',' ) }
				</output>
				{ panels.map( ( panel ) => (
					<section key={ panel.name } aria-label={ panel.title }>
						<Slot
							name={ getPanelSlotName( panel.name ) }
							fillProps={ { disabled: true } }
						/>
					</section>
				) ) }
				{ children }
			</MediaEditorPanelsProvider>
		</SlotFillProvider>
	);
}

describe( 'MediaEditorPanel', () => {
	it( 'gives the editor a tab and renders its content there', () => {
		render(
			<Editor>
				<MediaEditorPanel name="plugin/vignette" title="Vignette">
					<p>Vignette controls</p>
				</MediaEditorPanel>
			</Editor>
		);

		expect( screen.getByTestId( 'tabs' ) ).toHaveTextContent(
			'plugin/vignette'
		);
		expect(
			screen.getByRole( 'region', { name: 'Vignette' } )
		).toHaveTextContent( 'Vignette controls' );
	} );

	it( 'orders tabs by order, then by name', () => {
		render(
			<Editor>
				<MediaEditorPanel name="plugin/b" title="B">
					b
				</MediaEditorPanel>
				<MediaEditorPanel
					name="core/details"
					title="Details"
					order={ 20 }
				>
					details
				</MediaEditorPanel>
				<MediaEditorPanel name="plugin/a" title="A">
					a
				</MediaEditorPanel>
				<MediaEditorPanel name="core/crop" title="Crop" order={ 0 }>
					crop
				</MediaEditorPanel>
			</Editor>
		);

		expect( screen.getByTestId( 'tabs' ) ).toHaveTextContent(
			'core/crop,plugin/a,plugin/b,core/details'
		);
	} );

	it( 'passes the sidebar props to a function child', () => {
		render(
			<Editor>
				<MediaEditorPanel name="plugin/vignette" title="Vignette">
					{ ( { disabled } ) => (
						<button disabled={ disabled }>Apply</button>
					) }
				</MediaEditorPanel>
			</Editor>
		);

		expect(
			screen.getByRole( 'button', { name: 'Apply' } )
		).toBeDisabled();
	} );

	it( 'keeps one tab for a panel that passes a new mediaTypes array every render', () => {
		// The editor re-renders whenever a panel announces itself, and a
		// plugin rendered by `PluginArea` re-renders with it. An inline
		// array must not make that a loop.
		function EditorWithInlinePanel() {
			const { panels, contextValue } = useMediaEditorPanels();
			return (
				<SlotFillProvider>
					<MediaEditorPanelsProvider value={ contextValue }>
						<output data-testid="tabs">
							{ panels
								.map( ( panel ) => panel.name )
								.join( ',' ) }
						</output>
						<MediaEditorPanel
							name="plugin/vignette"
							title="Vignette"
							mediaTypes={ [ 'image' ] }
						>
							content
						</MediaEditorPanel>
					</MediaEditorPanelsProvider>
				</SlotFillProvider>
			);
		}

		render( <EditorWithInlinePanel /> );

		expect( screen.getByTestId( 'tabs' ) ).toHaveTextContent(
			'plugin/vignette'
		);
	} );

	it( 'removes its tab when unmounted', () => {
		function Toggle() {
			const [ shown, setShown ] = useState( true );
			return (
				<>
					<button onClick={ () => setShown( false ) }>hide</button>
					{ shown && (
						<MediaEditorPanel
							name="plugin/vignette"
							title="Vignette"
						>
							content
						</MediaEditorPanel>
					) }
				</>
			);
		}
		render(
			<Editor>
				<Toggle />
			</Editor>
		);
		expect( screen.getByTestId( 'tabs' ) ).toHaveTextContent(
			'plugin/vignette'
		);

		fireEvent.click( screen.getByRole( 'button', { name: 'hide' } ) );

		expect( screen.getByTestId( 'tabs' ) ).toBeEmptyDOMElement();
	} );

	it( 'keeps a failing panel inside its tab', () => {
		function Broken(): never {
			throw new Error( 'Broken panel' );
		}
		render(
			<Editor>
				<MediaEditorPanel name="plugin/broken" title="Broken">
					<Broken />
				</MediaEditorPanel>
				<MediaEditorPanel name="plugin/fine" title="Fine">
					<p>Fine content</p>
				</MediaEditorPanel>
			</Editor>
		);

		// React reports the error it handed to the boundary.
		expect( console ).toHaveErrored();
		expect( screen.getByTestId( 'tabs' ) ).toHaveTextContent(
			'plugin/broken,plugin/fine'
		);
		expect(
			screen.getByRole( 'region', { name: 'Broken' } )
		).toHaveTextContent( 'The "Broken" panel could not be shown' );
		expect(
			screen.getByRole( 'region', { name: 'Fine' } )
		).toHaveTextContent( 'Fine content' );
	} );
} );
