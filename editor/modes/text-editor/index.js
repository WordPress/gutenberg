/**
 * External dependencies
 */
import { connect } from 'react-redux';
import Textarea from 'react-textarea-autosize';

/**
 * Internal dependencies
 */
import './style.scss';

function TextEditor( { blocks, onChange } ) {
	return (
		<div>
			<header className="editor-text-editor__formatting">
				<div>
					<button className="editor-text-editor__bold">b</button>
					<button className="editor-text-editor__italic">i</button>
					<button className="editor-text-editor__link">link</button>
					<button>b-quote</button>
					<button className="editor-text-editor__del">del</button>
					<button>ins</button>
					<button>img</button>
					<button>ul</button>
					<button>ol</button>
					<button>li</button>
					<button>code</button>
					<button>more</button>
					<button>close tags</button>
				</div>
			</header>
			<Textarea
				autoComplete="off"
				defaultValue={ wp.blocks.serialize( blocks ) }
				onBlur={ ( event ) => onChange( event.target.value ) }
				className="editor-text-editor"
				useCacheForDOMMeasurements
			/>
		</div>
	);
}

export default connect(
	( state ) => ( {
		blocks: state.blocks.order.map( ( uid ) => (
			state.blocks.byUid[ uid ]
		) )
	} ),
	( dispatch ) => ( {
		onChange( value ) {
			dispatch( {
				type: 'REPLACE_BLOCKS',
				blockNodes: wp.blocks.parse( value )
			} );
		}
	} )
)( TextEditor );
