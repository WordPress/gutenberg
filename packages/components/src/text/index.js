/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import { text } from './styles/text-mixins';

const Text = styled.span(
	`
	box-sizing: border-box;
	margin: 0;
`,
	text
);

export default Text;
