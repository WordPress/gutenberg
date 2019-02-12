/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { RichText } from '@wordpress/editor';
import { decodeEntities } from '@wordpress/html-entities';
import { withDispatch } from '@wordpress/data';
import { withFocusOutside } from '@wordpress/components';
import { withInstanceId, compose } from '@wordpress/compose';

const minHeight = 53;

class PostTitle extends Component {
	constructor() {
		super( ...arguments );

		this.onSelect = this.onSelect.bind( this );
		this.onUnselect = this.onUnselect.bind( this );

		this.state = {
			isSelected: false,
			aztecHeight: 0,
		};
	}

	handleFocusOutside() {
		this.onUnselect();
	}

	onSelect() {
		this.setState( { isSelected: true } );
		this.props.clearSelectedBlock();
	}

	onUnselect() {
		this.setState( { isSelected: false } );
	}

	render() {
		const {
			placeholder,
			style,
			title,
		} = this.props;

		const decodedPlaceholder = decodeEntities( placeholder );

		return (
			<RichText
				tagName={ 'p' }
				onFocus={ this.onSelect }
				onBlur={ this.props.onBlur } // always assign onBlur as a props
				multiline={ false }
				style={ [ style, {
					minHeight: Math.max( minHeight, this.state.aztecHeight ),
				} ] }
				fontSize={ 24 }
				fontWeight={ 'bold' }
				onChange={ ( event ) => {
					this.props.onUpdate( event.content );
				} }
				onContentSizeChange={ ( event ) => {
					this.setState( { aztecHeight: event.aztecHeight } );
				} }
				placeholder={ decodedPlaceholder }
				value={ title }
				onSplit={ this.props.onEnterPress }
			>
			</RichText>
		);
	}
}

const applyWithDispatch = withDispatch( ( dispatch ) => {
	const {
		insertDefaultBlock,
		clearSelectedBlock,
		undo,
		redo,
	} = dispatch( 'core/editor' );

	return {
		onEnterPress() {
			insertDefaultBlock( undefined, undefined, 0 );
		},
		onUndo: undo,
		onRedo: redo,
		clearSelectedBlock,
	};
} );

export default compose(
	applyWithDispatch,
	withInstanceId,
	withFocusOutside
)( PostTitle );
