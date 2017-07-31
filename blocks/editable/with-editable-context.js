/**
 * External dependencies
 */
import { pick, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from 'element';

export default function withEditableContext( OriginalComponent ) {
	class WrappedComponent extends Component {
		constructor() {
			super( ...arguments );

			this.onChange = this.onChange.bind( this );
		}

		componentDidMount() {
			const { focusEmitter } = this.context;
			focusEmitter.addListener( 'change', this.onChange );
		}

		componentWillUnmount() {
			const { focusEmitter } = this.context;
			focusEmitter.removeListener( 'change', this.onChange );
		}

		onChange() {
			this.forceUpdate();
		}

		render() {
			return (
				<OriginalComponent
					{ ...this.props }
					{ ...pick(
						// Prefer value from props over context
						{ ...this.props, ...this.context },
						Object.keys( WrappedComponent.contextTypes )
					) }
				/>
			);
		}
	}

	WrappedComponent.contextTypes = {
		focusEmitter: noop,
		focus: noop,
		onUndo: noop,
		onFocus: noop,
	};

	const { displayName = Component.name || 'Component' } = Component;
	WrappedComponent.displayName = `withEditableContext(${ displayName })`;

	return WrappedComponent;
}
