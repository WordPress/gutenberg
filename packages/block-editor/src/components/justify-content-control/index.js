/**
 * Internal dependencies
 */
import JustifyContentUI from './ui';

export function JustifyContentControl( props ) {
	return <JustifyContentUI { ...props } isToolbar={ false } />;
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/justify-content-control/README.md
 */
export function JustifyToolbar( props ) {
	return <JustifyContentUI { ...props } isToolbar />;
}
