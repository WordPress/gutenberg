/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { noop } from 'lodash';

const getPath = ( fileType, dependencies ) =>
	`/wp/v2/${ fileType }/?${ dependencies.map(
		( dependency ) => `dependency=${ dependency }`
	) }`;

export default class LazyLoad extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			loaded: false,
		};

		this.loadScripts = this.loadScripts.bind( this );
		this.loadStyles = this.loadStyles.bind( this );
	}

	async loadScripts() {
		const scriptsToLoad = this.props.scripts.filter(
			( script ) => ! LazyLoad.loadedScripts.has( script )
		);

		if ( scriptsToLoad.length === 0 ) {
			return Promise.resolve();
		}

		const path = getPath( 'scripts', scriptsToLoad );

		const scriptsWithDeps = await apiFetch( { path } );

		await Promise.all(
			scriptsWithDeps.map( ( { src: scriptSrc } ) => {
				return new Promise( ( resolve, reject ) => {
					const scriptElement = document.createElement( 'script' );
					scriptElement.src = scriptSrc;
					scriptElement.defer = true;
					scriptElement.onload = resolve;
					scriptElement.onerror = reject;
					document.body.appendChild( scriptElement );
				} );
			} )
		);

		scriptsWithDeps.forEach( ( { handle } ) =>
			LazyLoad.loadedScripts.add( handle )
		);
	}

	async loadStyles() {
		const stylesToLoad = this.props.styles.filter(
			( style ) => ! LazyLoad.loadedStyles.has( style )
		);

		if ( stylesToLoad.length === 0 ) {
			return Promise.resolve();
		}

		const path = getPath( 'styles', stylesToLoad );

		const stylesWithDeps = await apiFetch( { path } );

		await Promise.all(
			stylesWithDeps.map( ( { src: styleHref } ) => {
				return new Promise( ( resolve, reject ) => {
					const linkElement = document.createElement( 'link' );
					linkElement.rel = 'stylesheet';
					linkElement.href = styleHref;
					linkElement.onload = resolve;
					linkElement.onerror = reject;
					document.head.appendChild( linkElement );
				} );
			} )
		);

		stylesWithDeps.forEach( ( { handle } ) =>
			LazyLoad.loadedStyles.add( handle )
		);
	}

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

LazyLoad.defaultProps = {
	scripts: [],
	styles: [],
	placeholder: null,
	onLoaded: () => Promise.resolve(),
	onError: noop,
};

LazyLoad.loadedScripts = new Set();
LazyLoad.loadedStyles = new Set();
