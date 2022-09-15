/**
 * Internal dependencies
 */
import JustifyContentUI from './ui';

const JustifyContentControl = ( props ) => {
	return <JustifyContentUI { ...props } isToolbar={ false } />;
};

const JustifyToolbar = ( props ) => {
	return <JustifyContentUI { ...props } isToolbar />;
};

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/justify-content-control/README.md
 */
export { JustifyContentControl, JustifyToolbar };
