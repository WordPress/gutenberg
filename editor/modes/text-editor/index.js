/**
 * External dependencies
 */
import { connect } from 'react-redux';
import Textarea from 'react-autosize-textarea';

/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { serialize, parse } from 'blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import PostTitle from '../../post-title';
import { getBlocks } from '../../selectors';

class TextEditor extends Component {
	constructor( { blocks } ) {
		super( ...arguments );
		this.state = {
			blocks,
			value: serialize( blocks ),
		};
		this.onChange = this.onChange.bind( this );
		this.onBlur = this.onBlur.bind( this );
	}

	onChange( event ) {
		this.setState( {
			value: event.target.value,
		} );
		this.props.markDirty();
	}

	onBlur() {
		const blocks = parse( this.state.value );
		this.setState( {
			blocks,
		} );
		this.props.onChange( blocks );
		this.props.markDirty();
	}

	componentWillReceiveProps( newProps ) {
		if ( newProps.blocks !== this.state.blocks ) {
			this.setState( {
				blocks: newProps.blocks,
				value: serialize( newProps.blocks ),
			} );
		}
	}

	render() {
		const { value } = this.state;

		return (
			<div className="editor-text-editor">
				<header className="editor-text-editor__formatting">
					<div className="editor-text-editor__formatting-group">
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
				<div className="editor-text-editor__body">
					<PostTitle />
					<Textarea
						autoComplete="off"
						value={ value }
						onChange={ this.onChange }
						onBlur={ this.onBlur }
						className="editor-text-editor__textarea"
					/>
				</div>
			</div>
		);
	}
}

export default connect(
	( state ) => ( {
		blocks: getBlocks( state ),
	} ),
	{
		onChange( blocks ) {
			return {
				type: 'RESET_BLOCKS',
				blocks,
			};
		},
		markDirty() {
			return {
				type: 'MARK_DIRTY',
			};
		},
	}
)( TextEditor );
