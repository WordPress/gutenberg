/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export class AutosaveMonitor extends Component {
	constructor( props ) {
		super( props );
		this.needsAutosave = !! ( props.isDirty && props.isAutosaveable );
	}

	componentDidMount() {
		if ( ! this.props.disableIntervalChecks ) {
			this.setAutosaveTimer();
		}
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.disableIntervalChecks ) {
			if ( this.props.editsReference !== prevProps.editsReference ) {
				this.props.autosave();
			}
			return;
		}

		if ( this.props.interval !== prevProps.interval ) {
			clearTimeout( this.timerId );
			this.setAutosaveTimer();
		}

		if ( ! this.props.isDirty ) {
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
		clearTimeout( this.timerId );
	}

	setAutosaveTimer( timeout = this.props.interval * 1000 ) {
		this.timerId = setTimeout( () => {
			this.autosaveTimerHandler();
		}, timeout );
	}

	autosaveTimerHandler() {
		if ( ! this.props.isAutosaveable ) {
			this.setAutosaveTimer( 1000 );
			return;
		}

		if ( this.needsAutosave ) {
			this.needsAutosave = false;
			this.props.autosave();
		}

		this.setAutosaveTimer();
	}

	render() {
		return null;
	}
}

/**
 * Monitors the changes made to the edited post and triggers autosave if necessary.
 *
 * The logic is straightforward: a check is performed every `props.interval` seconds. If any changes are detected, `props.autosave()` is called.
 * The time between the change and the autosave varies but is no larger than `props.interval` seconds. Refer to the code below for more details, such as
 * the specific way of detecting changes.
 *
 * There are two caveats:
 * * If `props.isAutosaveable` happens to be false at a time of checking for changes, the check is retried every second.
 * * The timer may be disabled by setting `props.disableIntervalChecks` to `true`. In that mode, any change will immediately trigger `props.autosave()`.
 *
 * @param {Object}   props                       - The properties passed to the component.
 * @param {Function} props.autosave              - The function to call when changes need to be saved.
 * @param {number}   props.interval              - The maximum time in seconds between an unsaved change and an autosave.
 * @param {boolean}  props.isAutosaveable        - If false, the check for changes is retried every second.
 * @param {boolean}  props.disableIntervalChecks - If true, disables the timer and any change will immediately trigger `props.autosave()`.
 * @param {boolean}  props.isDirty               - Indicates if there are unsaved changes.
 *
 * @example
 * ```jsx
 * <AutosaveMonitor interval={30000} />
 * ```
 */
export default compose( [
	withSelect( ( select, ownProps ) => {
		const { getReferenceByDistinctEdits } = select( coreStore );

		const {
			isEditedPostDirty,
			isEditedPostAutosaveable,
			isAutosavingPost,
			getEditorSettings,
		} = select( editorStore );

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
			const { autosave = dispatch( editorStore ).autosave } = ownProps;
			autosave();
		},
	} ) ),
] )( AutosaveMonitor );
