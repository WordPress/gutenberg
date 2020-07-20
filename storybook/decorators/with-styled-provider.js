/**
 * Internal dependencies
 */
import { __experimentalStyledProvider as StyledProvider } from '../../packages/components/src/index';

function withStyledProvider( storyFn ) {
	return <StyledProvider>{ storyFn() }</StyledProvider>;
}

export default withStyledProvider;
