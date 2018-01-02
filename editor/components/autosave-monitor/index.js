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
import { autosave } from '../../store/actions';
import {
	isEditedPostDirty,
	isEditedPostSaveable,
} from '../../store/selectors';

export class AutosaveMonitor extends Component {
	componentDidUpdate( prevProps ) {
		const { isDirty, isSaveable } = this.props;
		if ( prevProps.isDirty !== isDirty ||
				prevProps.isSaveable !== isSaveable ) {
			this.toggleTimer( isDirty && isSaveable );
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
		};
	},
	{ autosave }
)( AutosaveMonitor );
