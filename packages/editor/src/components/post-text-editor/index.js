/**
 * External dependencies
 */
import Textarea from 'react-autosize-textarea';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { Component, Fragment } from '@wordpress/element';
import { parse } from '@wordpress/blocks';
import { withSelect, withDispatch } from '@wordpress/data';
import { withInstanceId, compose } from '@wordpress/compose';

/**
 * Returns the PostTextEditor state given a set of props.
 *
 * @param {Object} props Component props.
 *
 * @return {Object} State object.
 */
function computeDerivedState( props ) {
	return {
		persistedValue: props.value,
		value: props.value,
		isDirty: false,
	};
}

export class PostTextEditor extends Component {
	constructor( props ) {
		super( ...arguments );

		this.edit = this.edit.bind( this );
		this.stopEditing = this.stopEditing.bind( this );

		this.state = computeDerivedState( props );
	}

	static getDerivedPropsFromState( props, state ) {
		// If we receive a new value while we're editing (but before we've made
		// changes), go ahead and clobber the local state
		const isReceivingNewNonConflictingPropsValue = (
			state.persistedValue !== props.value &&
			! state.isDirty
		);

		// While editing text, value is maintained in state. Prefer this value,
		// deferring to the incoming prop only if not editing (value `null`).
		// It is not necessary to compare to a previous state value because the
		// null state value will be immediately replaced with the props value.
		// Therefore, state value is effectively never assigned as null.
		const hasStoppedEditing = state.value === null;

		if ( isReceivingNewNonConflictingPropsValue || hasStoppedEditing ) {
			return computeDerivedState( props );
		}

		return null;
	}

	/**
	 * Handles a textarea change event to notify the onChange prop callback and
	 * reflect the new value in the component's own state. This marks the start
	 * of the user's edits, if not already changed, preventing future props
	 * changes to value from replacing the rendered value. This is expected to
	 * be followed by a reset to editing state via `stopEditing`.
	 *
	 * @see stopEditing
	 *
	 * @param {Event} event Change event.
	 */
	edit( event ) {
		const value = event.target.value;
		this.props.onChange( value );
		this.setState( { value, isDirty: true } );
	}

	/**
	 * Function called when the user has completed their edits, responsible for
	 * ensuring that changes, if made, are surfaced to the onPersist prop
	 * callback and resetting editing state.
	 */
	stopEditing() {
		if ( this.state.isDirty ) {
			this.props.onPersist( this.state.value );
		}

		// Other state values will be reset as a result of the subsequent call
		// to getDerivedPropsFromState on this state change.
		//
		// See: getDerivedPropsFromState (hasStoppedEditing)
		this.setState( { value: null } );
	}

	render() {
		const { value } = this.state;
		const { placeholder, instanceId } = this.props;
		const decodedPlaceholder = decodeEntities( placeholder );

		return (
			<Fragment>
				<label htmlFor={ `post-content-${ instanceId }` } className="screen-reader-text">
					{ decodedPlaceholder || __( 'Write your story' ) }
				</label>
				<Textarea
					autoComplete="off"
					value={ value }
					onChange={ this.edit }
					onBlur={ this.stopEditing }
					className="editor-post-text-editor"
					id={ `post-content-${ instanceId }` }
					placeholder={ decodedPlaceholder || __( 'Write your story' ) }
				/>
			</Fragment>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const { getEditedPostContent, getEditorSettings } = select( 'core/editor' );
		const { bodyPlaceholder } = getEditorSettings();
		return {
			value: getEditedPostContent(),
			placeholder: bodyPlaceholder,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { editPost, resetBlocks, checkTemplateValidity } = dispatch( 'core/editor' );
		return {
			onChange( content ) {
				editPost( { content } );
			},
			onPersist( content ) {
				resetBlocks( parse( content ) );
				checkTemplateValidity();
			},
		};
	} ),
	withInstanceId,
] )( PostTextEditor );
