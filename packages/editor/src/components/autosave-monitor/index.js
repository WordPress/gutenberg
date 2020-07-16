/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';

export class AutosaveMonitor extends Component {
	constructor( props ) {
		super( props );
		this.needsAutosave = props.isDirty && props.isAutosaveable;
	}

	componentDidMount() {
		this.scheduleAutosave();
	}

	componentDidUpdate( prevProps ) {
		if ( ! this.props.isDirty && prevProps.isDirty ) {
			this.needsAutosave = false;
			return;
		}

		if ( this.props.isAutosaving && ! prevProps.isAutosaving ) {
			this.needsAutosave = false;
			return;
		}

		if ( this.props.editsReference !== prevProps.editsReference ) {
			this.needsAutosave = true;
		}
	}

	componentWillUnmount() {
		clearTimeout( this.recurringAutosaveTimeout );
	}

	scheduleAutosave( timeout = this.props.interval * 1000 ) {
		this.recurringAutosaveTimeout = setTimeout( () => {
			this.recurringAutosaveHandler();
		}, timeout );
	}

	recurringAutosaveHandler() {
		if ( ! this.props.isAutosaveable ) {
			this.scheduleAutosave( 1000 );
			return;
		}

		if ( this.needsAutosave ) {
			this.needsAutosave = false;
			this.props.autosave();
		}

		this.scheduleAutosave();
	}

	render() {
		return null;
	}
}

export default compose( [
	withSelect( ( select, ownProps ) => {
		const { getReferenceByDistinctEdits } = select( 'core' );

		const {
			isEditedPostDirty,
			isEditedPostAutosaveable,
			isAutosavingPost,
			getEditorSettings,
		} = select( 'core/editor' );

		const { interval = getEditorSettings().autosaveInterval } = ownProps;

		return {
			editsReference: getReferenceByDistinctEdits(),
			isDirty: isEditedPostDirty(),
			isAutosaveable: isEditedPostAutosaveable(),
			isAutosaving: isAutosavingPost(),
			interval,
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => ( {
		autosave() {
			const { autosave = dispatch( 'core/editor' ).autosave } = ownProps;
			autosave();
		},
	} ) ),
] )( AutosaveMonitor );
