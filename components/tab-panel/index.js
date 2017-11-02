/**
 * External dependencies
 */
import { partial, noop } from 'lodash';

/**
 * WordPress dependencies
 */
// import './style.scss';
import { Component } from '@wordpress/element';
import { default as withInstanceId } from '../higher-order/with-instance-id';
import { NavigableMenu } from '../navigable-container';

class TabButton extends Component {
	render() {
		const { tabId, children, clickTab, ...rest } = this.props;
		return <button role="tab"
			tabIndex={ -1 }
			id={ tabId }
			onClick={ partial( clickTab, tabId ) }
			{ ...rest }>
			{ children }
		</button>;
	}
}

class TabPanel extends Component {
	constructor() {
		super( ...arguments );

		this.handleClick = this.handleClick.bind( this );
		this.handleFocus = this.handleFocus.bind( this );
		this.bindTabsRef = this.bindTabsRef.bind( this );
		this.onNavigate = this.onNavigate.bind( this );

		this.state = {
			selected: this.props.tabs.length > 0 ? this.props.tabs[ 0 ].name : null,
		};
	}

	bindTabsRef( ref ) {
		this.tabsNode = ref;
	}

	handleClick( tabKey, onSelect = noop ) {
		this.setState( {
			selected: tabKey,
		} );
		onSelect( tabKey );
	}

	onNavigate( childIndex, child ) {
		child.click();
	}

	handleFocus( event ) {
		if ( event.target === this.tabsNode ) {
			const selectedNode = this.tabsNode.querySelector( '[aria-selected="true"]' );
			if ( selectedNode ) {
				selectedNode.focus();
			}
		}
	}

	render() {
		const { selected } = this.state;
		const { instanceId, tabs, activeClass, className, orientation = 'horizontal' } = this.props;

		const selectedTab = tabs.find( ( t ) => t.name === selected );
		const selectedId = instanceId + '-' + selectedTab.name;

		return (
			<div>
				<NavigableMenu orientation={ orientation } initialSelector={ '[aria-selected="true"]' }
					handleRef={ this.bindTabsRef }
					role="tablist"
					aria-orientation={ orientation }
					onNavigate={ this.onNavigate }
					className={ className }
					tabIndex={ 0 }
					onFocus={ this.handleFocus }
					onKeyDown={ this.handleKeyDown }>
					{ tabs.map( ( t ) =>
						<TabButton className={ `${ t.className } ${ t.name === selected ? activeClass : '' }` }
							tabId={ instanceId + '-' + t.name }
							aria-controls={ instanceId + '-' + t.name + '-view' }
							aria-selected={ t.name === selected }
							key={ t.name }
							clickTab={ partial( this.handleClick, t.name, t.onSelect ) }>
							{ t.title }
						</TabButton> )
					}
				</NavigableMenu>
				{
					selectedTab ?
						<div aria-labelledby={ selectedId }
							role="tabpanel"
							id={ selectedId + '-view' }>
							{ this.props.children( selectedTab.name ) }
						</div> : null
				}
			</div>
		);
	}
}

export default withInstanceId( TabPanel );
