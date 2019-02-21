/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { RichText } from '@wordpress/editor';
import { decodeEntities } from '@wordpress/html-entities';
import { withDispatch } from '@wordpress/data';
import { withFocusOutside } from '@wordpress/components';
import { withInstanceId, compose } from '@wordpress/compose';

import { View } from 'react-native';

import styles from './style.scss';

const minHeight = 30;

class PostTitle extends Component {
	titleViewRef: Object;

	constructor() {
		super( ...arguments );

		this.onSelect = this.onSelect.bind( this );
		this.onUnselect = this.onUnselect.bind( this );

		this.state = {
			isSelected: false,
			aztecHeight: 0,
		};
	}

	componentDidMount() {
		if ( this.props.ref ) {
			this.props.ref( this );
		}
	}

	handleFocusOutside() {
		this.onUnselect();
	}

	focus() {
		if ( this.titleViewRef ) {
			this.titleViewRef.focus();
			this.setState( { isSelected: true } );
		}
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
			focusedBorderColor,
			borderStyle,
		} = this.props;

		const decodedPlaceholder = decodeEntities( placeholder );
		const borderColor = this.state.isSelected ? focusedBorderColor : 'transparent';

		return (
			<View style={ [ styles.titleContainer, borderStyle, { borderColor } ] }>
				<RichText
					tagName={ 'p' }
					rootTagsToEliminate={ [ 'strong' ] }
					onFocus={ this.onSelect }
					onBlur={ this.props.onBlur } // always assign onBlur as a props
					multiline={ false }
					style={ [ style, {
						minHeight: Math.max( minHeight, this.state.aztecHeight ),
					} ] }
					fontSize={ 24 }
					fontWeight={ 'bold' }
					onChange={ ( value ) => {
						this.props.onUpdate( value );
					} }
					onContentSizeChange={ ( event ) => {
						this.setState( { aztecHeight: event.aztecHeight } );
					} }
					placeholder={ decodedPlaceholder }
					value={ title }
					onSplit={ this.props.onEnterPress }
					setRef={ ( ref ) => {
						this.titleViewRef = ref;
					} }
				>
				</RichText>
			</View>
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
