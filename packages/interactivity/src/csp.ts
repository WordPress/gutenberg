/**
 * CSP support for the Interactivity API.
 *
 * Mirrors Datastar's `library/src/engine/csp.ts`:
 * - If `<html data-nonce="...">` is present, `cspEnabled` is true and
 *   expressions are compiled via a nonced `<script>` element instead of
 *   `Function()`, so `script-src 'nonce-...'` works without `unsafe-eval`.
 * - If absent, falls back to `Function()` (current behaviour, fully
 *   cacheable, requires `unsafe-eval` when a `script-src` CSP is present).
 *
 * `data-nonce` is transport only — JS cannot read the CSP header and the
 * header may be set at nginx/CDN. The server (or edge) must inject the same
 * nonce into both `Content-Security-Policy: script-src 'nonce-{value}'` and
 * `<html data-nonce="{value}">`. Per spec the nonce is `base64(random_bytes(16))`
 * per full-page response; cached HTML must not reuse it.
 *
 * PHP opt-in: `apply_filters( 'wp_interactivity_csp_nonce', null )` — default
 * `null` means no attribute/header. See `wp-includes/interactivity-api/interactivity-api.php`.
 */

type ExpressionFn = ( ...args: any[] ) => any;

const nonceAttribute = 'data-nonce';
const root =
	typeof document !== 'undefined' ? document.documentElement : null;
const pageNonce = root?.getAttribute( nonceAttribute ) ?? null;

const cspEnabled = pageNonce !== null;

let policy: any;
if ( cspEnabled ) {
	if ( ! pageNonce ) {
		throw new Error(
			'Interactivity API CSP requires a nonempty html data-nonce.'
		);
	}
	root!.removeAttribute( nonceAttribute );
	policy = ( window as any ).trustedTypes?.createPolicy(
		'wp-interactivity',
		{
			createHTML: ( html: string ) => html,
			createScript: ( script: string ) => script,
		}
	);
}

export const prepareScript = (
	script: HTMLScriptElement,
	content: string
): void => {
	if ( cspEnabled ) {
		script.nonce = pageNonce!;
	}
	script.text = policy ? policy.createScript( content ) : content;
};

export const createHTML = ( html: string ): any =>
	policy ? policy.createHTML( html ) : html;

const compiledExpressions = new Map< string, ExpressionFn >();

export const compileExpression = (
	argNames: string[],
	expression: string
): ExpressionFn => {
	if ( ! cspEnabled ) {
		return Function( ...argNames, expression ) as ExpressionFn;
	}

	const source = `function(${ argNames.join( ',' ) }){${ expression }\n}`;
	const cached = compiledExpressions.get( source );
	if ( cached ) {
		return cached;
	}

	const script = document.createElement( 'script' );
	prepareScript( script, `document.currentScript.x=${ source }` );
	document.head.appendChild( script );
	script.remove();

	const compiled = ( script as any ).x as ExpressionFn | undefined;
	if ( ! compiled ) {
		throw new Error( 'CSP blocked Interactivity API expression compilation.' );
	}
	compiledExpressions.set( source, compiled );
	return compiled;
};

export const isCSPEnabled = (): boolean => cspEnabled;
export const getPageNonce = (): string | null => pageNonce;
