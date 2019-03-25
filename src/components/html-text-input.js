/**
 * @format
 * @flow
 */
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { parse } from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { withInstanceId, compose } from '@wordpress/compose';

/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import HTMLInputViewUI from './html-text-input-ui/html-text-input-ui';

type PropsType = {
	onChange: string => mixed,
	onPersist: string => mixed,
	setTitleAction: string => void,
	value: string,
	title: string,
	parentHeight: number,
};

type StateType = {
	isDirty: boolean,
	value: string,
};

export class HTMLInputView extends React.Component<PropsType, StateType> {
	edit: string => mixed;
	stopEditing: () => mixed;

	constructor() {
		super( ...arguments );

		this.edit = this.edit.bind( this );
		this.stopEditing = this.stopEditing.bind( this );

		this.state = {
			isDirty: false,
			value: '',
		};
	}

	static getDerivedStateFromProps( props: PropsType, state: StateType ) {
		if ( state.isDirty ) {
			return null;
		}

		return {
			value: props.value,
			isDirty: false,
		};
	}

	componentWillUnmount() {
		//TODO: Blocking main thread
		this.stopEditing();
	}

	edit( html: string ) {
		this.props.onChange( html );
		this.setState( { value: html, isDirty: true } );
	}

	stopEditing() {
		if ( this.state.isDirty ) {
			this.props.onPersist( this.state.value );
			this.setState( { isDirty: false } );
		}
	}

	render() {
		return (
			<HTMLInputViewUI
				setTitleAction={ this.props.setTitleAction }
				value={ this.state.value }
				title={ this.props.title }
				parentHeight={ this.props.parentHeight }
				onChangeHTMLText={ this.edit }
				onBlurHTMLText={ this.stopEditing }
				titlePlaceholder={ __( 'Add title' ) }
				htmlPlaceholder={ __( 'Start writing…' ) }
			/>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const {
			getEditedPostContent,
		} = select( 'core/editor' );

		return {
			value: getEditedPostContent(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { resetBlocks } = dispatch( 'core/block-editor' );
		const { editPost } = dispatch( 'core/editor' );
		return {
			onChange( content ) {
				editPost( { content } );
			},
			onPersist( content ) {
				resetBlocks( parse( content ) );
			},
		};
	} ),
	withInstanceId,
] )( HTMLInputView );
