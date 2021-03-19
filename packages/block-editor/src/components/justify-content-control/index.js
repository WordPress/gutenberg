/**
 * Internal dependencies
 */
import JustifyContentUI from './ui';

export function JustifyContentControl( props ) {
	return <JustifyContentUI { ...props } isToolbar={ false } />;
}

export function JustifyToolbar( props ) {
	return <JustifyContentUI { ...props } isToolbar />;
}
