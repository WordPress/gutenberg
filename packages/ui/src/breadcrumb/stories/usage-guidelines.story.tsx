import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from '@wordpress/element';
import * as Breadcrumb from '../';

const meta: Meta = {
	title: 'Components/@wordpress-ui/Breadcrumb/Usage Guidelines',
	id: 'design-system-components-breadcrumb-usage-guidelines',
	parameters: {
		controls: { disable: true },
	},
	tags: [ '!dev' ],
};
export default meta;

type Story = StoryObj;

/**
 * Button ancestors select a position within one hierarchy. The consumer owns
 * selection and intentional focus moves. Set aria-current="true" on CurrentItem
 * to preserve group semantics after the final ancestor is removed.
 */
export const HierarchySelection: Story = {
	render: function SelectionExample() {
		const [ selectedIndex, setSelectedIndex ] = useState( 3 );
		const [ width, setWidth ] = useState( 420 );
		const [ focusEditor, setFocusEditor ] = useState( false );
		const editorRef = useRef< HTMLTextAreaElement >( null );
		const labels = [
			'Document',
			'Outer group',
			'Inner group',
			'Paragraph',
		];
		return (
			<div
				style={ {
					display: 'grid',
					gap: 'var(--wpds-dimension-gap-md)',
				} }
			>
				<label htmlFor="breadcrumb-width">
					Trail width
					<input
						id="breadcrumb-width"
						type="range"
						min={ 80 }
						max={ 600 }
						value={ width }
						onChange={ ( event ) =>
							setWidth( Number( event.target.value ) )
						}
					/>
				</label>
				<label htmlFor="breadcrumb-focus-editor">
					<input
						id="breadcrumb-focus-editor"
						type="checkbox"
						checked={ focusEditor }
						onChange={ ( event ) =>
							setFocusEditor( event.target.checked )
						}
					/>
					Focus the editor on selection
				</label>
				<Breadcrumb.Root
					aria-label="Block hierarchy"
					style={ { width, maxWidth: '100%' } }
				>
					{ labels
						.slice( 0, selectedIndex )
						.map( ( label, index ) => (
							<Breadcrumb.ButtonItem
								key={ label }
								onClick={ () => {
									setSelectedIndex( index );
									if ( focusEditor ) {
										editorRef.current?.focus();
									}
								} }
							>
								{ label }
							</Breadcrumb.ButtonItem>
						) ) }
					<Breadcrumb.CurrentItem
						aria-current="true"
						key={ labels[ selectedIndex ] }
					>
						{ labels[ selectedIndex ] }
					</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
				<label htmlFor="breadcrumb-editor">
					Editor
					<textarea
						id="breadcrumb-editor"
						ref={ editorRef }
						defaultValue="Select an ancestor, or clear selection by choosing Document."
					/>
				</label>
				<button onClick={ () => setSelectedIndex( 3 ) }>
					Select Paragraph
				</button>
			</div>
		);
	},
};
