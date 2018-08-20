/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import CodeEditor from './editor';
import Placeholder from '../../packages/components/src/placeholder';
import Spinner from '../../packages/components/src/spinner';

/**
 * Moddule constants
 */
let siteURL;

/**
 * Configure the site's URL to lazy load scripts and styles.
 *
 * @param {string} url Site url.
 */
export function unstable__setSiteURL( url ) { // eslint-disable-line camelcase
	siteURL = url;
}

function loadScript() {
	return new Promise( ( resolve, reject ) => {
		const handles = [ 'wp-codemirror', 'code-editor', 'htmlhint', 'csslint', 'jshint' ];

		// Don't load htmlhint-kses unless we need it
		if ( window._wpGutenbergCodeEditorSettings.htmlhint.kses ) {
			handles.push( 'htmlhint-kses' );
		}

		const script = document.createElement( 'script' );
		script.src = `${ siteURL }/wp-admin/load-scripts.php?load=${ handles.join( ',' ) }`;
		script.onload = resolve;
		script.onerror = reject;

		document.head.appendChild( script );
	} );
}

function loadStyle() {
	return new Promise( ( resolve, reject ) => {
		const handles = [ 'wp-codemirror', 'code-editor' ];

		const style = document.createElement( 'link' );
		style.rel = 'stylesheet';
		style.href = `${ siteURL }/wp-admin/load-styles.php?load=${ handles.join( ',' ) }`;
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

	return Promise.all( [ loadScript(), loadStyle() ] ).then( () => {
		hasAlreadyLoadedAssets = true;
	} );
}

class LazyCodeEditor extends Component {
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
			return (
				<Placeholder>
					<Spinner />
				</Placeholder>
			);
		}

		if ( this.state.status === 'error' ) {
			return <Placeholder>{ __( 'An unknown error occurred.' ) }</Placeholder>;
		}

		return <CodeEditor { ...this.props } />;
	}
}

export default LazyCodeEditor;
