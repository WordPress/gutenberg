/**
 * External Dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';

export class AutosaveMonitor extends Component {
	componentDidUpdate( prevProps ) {
		const { isPostSaveable, isDirty, isSaveable } = this.props;
		if ( prevProps.isDirty !== isDirty ||
				prevProps.isSaveable !== isSaveable ) {
			this.toggleTimer( isPostSaveable && isDirty && isSaveable );
		}
	}

	componentWillUnmount() {
		this.toggleTimer( false );
	}

	toggleTimer( isPendingSave ) {
		clearTimeout( this.pendingSave );

		if ( isPendingSave ) {
			this.pendingSave = setTimeout(
				() => this.props.autosave(),
				10000
			);
		}
	}

	render() {
		return null;
	}
}

export default compose( [
	withSelect( ( select ) => {
		const { isEditedPostDirty, isEditedPostSaveable, getCurrentPost } = select( 'core/editor' );
		const { getPostType } = select( 'core' );

		const post = getCurrentPost();

		return {
			isDirty: isEditedPostDirty(),
			isSaveable: isEditedPostSaveable(),
			isPostSaveable: get( getPostType( post.type ), [ 'saveable' ], true ),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		autosave: dispatch( 'core/editor' ).autosave,
	} ) ),
] )( AutosaveMonitor );
