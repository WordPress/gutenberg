/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * External dependencies
 */
import { noop } from 'lodash';

export default class LazyLoad extends Component {
	static loadedScripts = new Set();
	static loadedStyles = new Set();
	static defaultProps = {
		scripts: [],
		styles: [],
		placeholder: null,
		onLoaded: () => Promise.resolve(),
		onError: noop,
	};

	state = {
		loaded: false,
	};

	loadScripts = async () => {
		const scriptsToLoad = this.props.scripts.filter(
			( script ) => ! this.loadedScripts.has( script )
		);

		if ( scriptsToLoad.length === 0 ) {
			return Promise.resolve();
		}

		await new Promise( ( resolve, reject ) => {
			const scriptElement = document.createElement( 'script' );
			// can't use load-scripts.php, so this would need to be replaced
			scriptElement.src = `/wp-admin/load-scripts.php?load=${ scriptsToLoad.join(
				','
			) }`;
			scriptElement.onload = resolve;
			scriptElement.onerror = reject;
			document.head.appendChild( scriptElement );
		} );

		scriptsToLoad.forEach( ( script ) => this.loadedScripts.add( script ) );
	};

	loadStyles = async () => {
		const stylesToLoad = this.props.styles.filter(
			( style ) => ! this.loadedStyles.has( style )
		);

		if ( stylesToLoad.length === 0 ) {
			return Promise.resolve();
		}

		await new Promise( ( resolve, reject ) => {
			const linkElement = document.createElement( 'link' );
			linkElement.rel = 'stylesheet';
			// can't use load-styles.php, so this would need to be replaced
			linkElement.href = `/wp-admin/load-styles.php?load=${ stylesToLoad.join(
				','
			) }`;
			linkElement.onload = resolve;
			linkElement.onerror = reject;
			document.head.appendChild( linkElement );
		} );

		stylesToLoad.forEach( ( style ) => this.loadedStyles.add( style ) );
	};

	componentDidMount() {
		Promise.all( [ this.loadScripts(), this.loadStyles() ] )
			.then( this.props.onLoaded )
			.then( () => {
				this.setState( { loaded: true } );
			} )
			.catch( this.props.onError );
	}

	render() {
		if ( this.state.loaded ) {
			return this.props.children;
		}

		return this.props.placeholder;
	}
}
