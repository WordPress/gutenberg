/**
 * External dependencies
 */
import type { ComponentPropsWithoutRef } from 'react';

export interface FocusableIframeProps
	extends ComponentPropsWithoutRef< 'iframe' > {
	iframeRef: React.Ref< HTMLIFrameElement >;
}
