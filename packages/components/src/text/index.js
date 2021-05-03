/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { text } from './styles/text-mixins';
import { withNextComponent } from './next';

const Text = styled.p(
	`
	box-sizing: border-box;
	margin: 0;
`,
	text
);

// @ts-ignore Text _is_ forwarded ref but the styled component definition doesn't include $$typeof so we'll just ignore it here
export default withNextComponent( Text );
