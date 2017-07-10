/**
 * External Dependencies
 */
import React, { PureComponent } from 'react';
import store from 'store';
import { EventEmitter } from 'events';

// Create a shared event emitter so that changes to a preference from one code
// snippet are reflected immediately in all other mounted Tabs components.
const bus = new EventEmitter();

class Tabs extends PureComponent {
	constructor( props ) {
		super( ...arguments );

		this.onPreferenceChange = this.onPreferenceChange.bind( this );

		const key = this.getPreferenceKey( props.tabs );
		this.state = {
			activeTab: Number( store.get( key ) ) || 0,
		};
	}

	componentDidMount() {
		bus.on( 'change', this.onPreferenceChange );
	}

	componentWillUnmount() {
		bus.removeListener( 'change', this.onPreferenceChange );
	}

	getPreferenceKey( tabs ) {
		return 'tabs-preference-' + tabs.map( ( tab ) => tab.name ).join();
	}

	onPreferenceChange( key, index ) {
		if ( key === this.getPreferenceKey( this.props.tabs ) ) {
			this.setState( { activeTab: index } );
		}
	}

	selectTab( index ) {
		return () => {
			const key = this.getPreferenceKey( this.props.tabs );
			store.set( key, index );
			bus.emit( 'change', key, index );
		};
	}

	render() {
		const { tabs } = this.props;
		const activeTab = tabs[ this.state.activeTab ];

		return (
			<div>
				{ tabs.map( ( tab, index ) => (
					<button
						key={ index }
						onClick={ this.selectTab( index ) }
						className={ index === this.state.activeTab ? 'components-code-tab is-active' : 'components-code-tab' }
					>
						{ tab.name }
					</button>
				) ) }
				{ activeTab && <div dangerouslySetInnerHTML={ { __html: activeTab.content } } /> }
			</div>
		);
	}
}

export default Tabs;
