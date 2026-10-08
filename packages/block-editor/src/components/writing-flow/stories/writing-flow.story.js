/**
 * WordPress dependencies
 */
import { useState, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { WritingFlow } from '@wordpress/block-editor';

export default {
	title: 'BlockEditor/WritingFlow',
	component: WritingFlow,
	parameters: {
		docs: {
			description: {
				component:
					'The `WritingFlow` component manages keyboard navigation and focus between vertically arranged editable fields.',
			},
		},
	},
};

export const Default = {
	render: () => <DefaultStory />,
};

function DefaultStory() {
	const [ blocks, setBlocks ] = useState( [
		{ id: '1', content: 'This is the first block.' },
		{ id: '2', content: 'This is the second block.' },
		{ id: '3', content: 'This is the third block.' },
	] );
	const [ activeId, setActiveId ] = useState( null );
	const refs = useRef( [] );

	const updateBlock = ( id, newContent ) => {
		setBlocks(
			blocks.map( ( block ) =>
				block.id === id ? { ...block, content: newContent } : block
			)
		);
	};

	const handleKeyDown = ( e, index ) => {
		if ( e.key === 'Tab' ) {
			e.preventDefault();
			const next = refs.current[ index + 1 ];
			if ( next ) {
				next.focus();
			}
		}
	};

	return (
		<div
			style={ {
				border: '1px solid #ddd',
				padding: '24px',
				maxWidth: '600px',
				margin: '2rem auto',
				background: '#fff',
				borderRadius: '6px',
			} }
		>
			<div style={ { marginBottom: '12px', fontSize: '14px' } }>
				<strong>Tip:</strong> Click into any block and use Tab or ↑↓ to
				navigate.
			</div>
			<WritingFlow>
				{ blocks.map( ( block, index ) => (
					<div key={ block.id } style={ { marginBottom: '12px' } }>
						<div
							ref={ ( el ) => ( refs.current[ index ] = el ) }
							contentEditable
							suppressContentEditableWarning
							onFocus={ () => setActiveId( block.id ) }
							onBlur={ ( e ) =>
								updateBlock( block.id, e.target.textContent )
							}
							onKeyDown={ ( e ) => handleKeyDown( e, index ) }
							role="textbox"
							aria-multiline="true"
							tabIndex={ 0 }
							style={ {
								padding: '12px',
								border:
									activeId === block.id
										? '2px solid #000'
										: '1px solid #ccc',
								borderRadius: '4px',
								minHeight: '40px',
								outline: 'none',
								background: '#fafafa',
								transition: 'border 0.2s',
							} }
							dangerouslySetInnerHTML={ {
								__html: block.content,
							} }
						/>
					</div>
				) ) }
			</WritingFlow>
		</div>
	);
}
