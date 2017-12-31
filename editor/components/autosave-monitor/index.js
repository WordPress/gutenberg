/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { doAutosave } from '../../store/actions';
import {
	isEditedPostDirty,
	isEditedPostSaveable,
	isPostAutosavable,
} from '../../store/selectors';

export class AutosaveMonitor extends Component {
	componentDidUpdate( prevProps ) {
		const { isDirty, isSaveable, isAutosavable } = this.props;
		if (
			prevProps.isDirty !== isDirty ||
			prevProps.isSaveable !== isSaveable ||
			prevProps.isAutosavable !== isAutosavable
		) {
			this.toggleTimer( isDirty && isSaveable && isAutosavable );
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

export default connect(
	( state ) => {
		return {
			isDirty: isEditedPostDirty( state ),
			isSaveable: isEditedPostSaveable( state ),
			isAutosavable: isPostAutosavable( state ),
		};
	},
	{ doAutosave }
)( AutosaveMonitor );
