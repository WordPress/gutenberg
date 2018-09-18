/**
 * External dependencies
 */
import { partial, noop, find } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withInstanceId } from '@wordpress/compose';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { NavigableMenu } from '../navigable-container';

const TabButton = ( { tabId, onClick, children, selected, ...rest } ) => (
	<button role="tab"
		tabIndex={ selected ? null : -1 }
		aria-selected={ selected }
		id={ tabId }
		onClick={ onClick }
		{ ...rest }
	>
		{ children }
	</button>
);

class TabPanel extends Component {
	constructor() {
		super( ...arguments );
		const { tabs, initialTabName } = this.props;

		this.handleClick = this.handleClick.bind( this );
		this.onNavigate = this.onNavigate.bind( this );

		this.state = {
			selected: initialTabName || ( tabs.length > 0 ? tabs[ 0 ].name : null ),
		};
	}

	handleClick( tabKey ) {
		const { onSelect = noop } = this.props;
		this.setState( {
			selected: tabKey,
		} );
		onSelect( tabKey );
	}

	onNavigate( childIndex, child ) {
		child.click();
	}

	render() {
		const { selected } = this.state;
		const {
			activeClass = 'is-active',
			className,
			instanceId,
			orientation = 'horizontal',
			tabs,
		} = this.props;

		const selectedTab = find( tabs, { name: selected } );
		const selectedId = instanceId + '-' + selectedTab.name;

		deprecated( 'Tab Panel child function argument used as string', {
			alternative: 'Argument is now an object, access the name property directly.',
			version: '4.2.0',
			plugin: 'Gutenberg',
			hint: 'This is a global warning, shown regardless of whether the component is used.',
		} );

		return (
			<div className={ className }>
				<NavigableMenu
					role="tablist"
					orientation={ orientation }
					onNavigate={ this.onNavigate }
					className="components-tab-panel__tabs"
				>
					{ tabs.map( ( tab ) => (
						<TabButton className={ `${ tab.className } ${ tab.name === selected ? activeClass : '' }` }
							tabId={ instanceId + '-' + tab.name }
							aria-controls={ instanceId + '-' + tab.name + '-view' }
							selected={ tab.name === selected }
							key={ tab.name }
							onClick={ partial( this.handleClick, tab.name ) }
						>
							{ tab.title }
						</TabButton>
					) ) }
				</NavigableMenu>
				{ selectedTab && (
					<div aria-labelledby={ selectedId }
						role="tabpanel"
						id={ selectedId + '-view' }
						className="components-tab-panel__tab-content"
						tabIndex="0"
					>
						{ this.props.children( Object.assign( new String( selectedTab.name ), selectedTab ) ) }
					</div>
				) }
			</div>
		);
	}
}

export default withInstanceId( TabPanel );
