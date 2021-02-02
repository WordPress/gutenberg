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

export default withNextComponent( Text );
