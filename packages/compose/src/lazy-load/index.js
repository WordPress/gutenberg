import { Component } from '@wordpress/element';

const lazyLoad = ( scripts, styles, baseUrl ) => ( Wrapped ) => {
	function loadScript() {
		return new Promise( ( resolve, reject ) => {
			const script = document.createElement( 'script' );
			script.src = baseUrl + '/wp-admin/load-scripts.php?load=' + scripts.join( ',' );
			script.onload = resolve;
			script.onerror = reject;

			document.head.appendChild( script );
		} );
	}

	function loadStyle() {
		return new Promise( ( resolve, reject ) => {
			const style = document.createElement( 'link' );
			style.rel = 'stylesheet';
			style.href = baseUrl + '/wp-admin/load-styles.php?load=' + styles.join( ',' );
			style.onload = resolve;
			style.onerror = reject;

			document.head.appendChild( style );
		} );
	}

	let hasAlreadyLoadedAssets = false;

	function loadAssets() {
		if ( hasAlreadyLoadedAssets ) {
			return Promise.resolve();
		}

		return Promise.all( [
			loadScript(),
			loadStyle(),
		] ).then( () => {
			hasAlreadyLoadedAssets = true;
		} );
	}

	class AsyncLoad extends Component {
		constructor() {
			super( ...arguments );

			this.state = {
				status: 'pending',
			};
		}

		componentDidMount() {
			loadAssets().then(
				() => {
					this.setState( { status: 'success' } );
				},
				() => {
					this.setState( { status: 'error' } );
				}
			);
		}

		render() {
			if ( this.state.status === 'pending' ) {
				return <div className="async-load__pending" />;
			}

			if ( this.state.status === 'error' ) {
				return <div className="async-load__error">An unknown error occurred.</div>;
			}

			return <Wrapped { ...this.props } />;
		}
	}

	return AsyncLoad;
};

export default lazyLoad;
