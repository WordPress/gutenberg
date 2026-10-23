import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Slot, SlotFillProvider } from '@wordpress/components';
import { createContext, useContext, useState } from '@wordpress/element';
import warning from '@wordpress/warning';
import MediaEditorPanel, {
	MediaEditorPanelsProvider,
	getPanelSlotName,
	useMediaEditorPanels,
} from '..';
import type { MediaType } from '../../../utils';

vi.mock( import( '@wordpress/warning' ), async ( importOriginal ) => {
	const original = await importOriginal();

	return {
		...original,
		default: vi.fn(),
	} as unknown as typeof original;
} );

const mockedWarning = vi.mocked( warning );

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
							bubblesVirtually
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
	beforeEach( () => {
		mockedWarning.mockClear();
	} );

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
			'core/crop,core/details,plugin/a,plugin/b'
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

	it( 'renders its content in its own tree, so a provider around the panel reaches it', () => {
		const PluginContext = createContext( 'default' );
		function ReadsContext() {
			return <p>{ useContext( PluginContext ) }</p>;
		}
		render(
			<Editor>
				<PluginContext.Provider value="from the plugin">
					<MediaEditorPanel name="plugin/context" title="Context">
						<ReadsContext />
					</MediaEditorPanel>
				</PluginContext.Provider>
			</Editor>
		);

		expect(
			screen.getByRole( 'region', { name: 'Context' } )
		).toHaveTextContent( 'from the plugin' );
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

	it( 'names the plugin scope when rendered outside the editor', () => {
		expect( () =>
			render(
				<MediaEditorPanel name="plugin/vignette" title="Vignette">
					content
				</MediaEditorPanel>
			)
		).toThrow( 'scope "media-editor"' );
	} );

	it( 'warns when two panels share a name', () => {
		render(
			<Editor>
				<MediaEditorPanel name="plugin/same" title="First">
					first
				</MediaEditorPanel>
				<MediaEditorPanel name="plugin/same" title="Second">
					second
				</MediaEditorPanel>
			</Editor>
		);

		expect( mockedWarning ).toHaveBeenCalledWith(
			expect.stringContaining( '"plugin/same"' )
		);
		expect( screen.getByTestId( 'tabs' ) ).toHaveTextContent(
			/^plugin\/same$/
		);
	} );

	it( 'warns about a media type the editor does not know', () => {
		const unknownType = 'pdf' as unknown as MediaType[ 'type' ];
		render(
			<Editor>
				<MediaEditorPanel
					name="plugin/pdf"
					title="PDF"
					mediaTypes={ [ unknownType ] }
				>
					content
				</MediaEditorPanel>
			</Editor>
		);

		expect( mockedWarning ).toHaveBeenCalledWith(
			expect.stringContaining( '"pdf"' )
		);
	} );

	it( 'warns about a name without a namespace', () => {
		render(
			<Editor>
				<MediaEditorPanel name="vignette" title="Vignette">
					content
				</MediaEditorPanel>
			</Editor>
		);

		expect( mockedWarning ).toHaveBeenCalledWith(
			expect.stringContaining( '"vignette"' )
		);
	} );

	it( 'does not warn about a well-formed panel', () => {
		render(
			<Editor>
				<MediaEditorPanel
					name="plugin/vignette"
					title="Vignette"
					mediaTypes={ [ 'image' ] }
				>
					content
				</MediaEditorPanel>
			</Editor>
		);

		expect( mockedWarning ).not.toHaveBeenCalled();
	} );
} );
