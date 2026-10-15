import JustifyContentUI from './ui';
import type { JustifyContentControlProps } from './types';

const JustifyContentControl = ( props: JustifyContentControlProps ) => {
	return <JustifyContentUI { ...props } isToolbar={ false } />;
};

const JustifyToolbar = ( props: JustifyContentControlProps ) => {
	return <JustifyContentUI { ...props } isToolbar />;
};

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/justify-content-control/README.md
 */
export { JustifyContentControl, JustifyToolbar };
