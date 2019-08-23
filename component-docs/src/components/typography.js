/**
 * External dependencies
 */
import styled from 'styled-components';

const Typography = styled.div`
	color: #444;
	line-height: 1.5;

	& > {
		h1,
		h2,
		h3,
		h4,
		h5,
		h6 {
			color: black;
			line-height: 1.2;
			margin-bottom: 0.75em;
		}

		h1 {
			font-size: 3.5em;
			font-weight: normal;
			max-width: calc( 100% - 30px );
		}

		h1 + p {
			font-size: 1.3em;
		}

		h2 {
			font-size: 2.25em;
			font-weight: normal;
		}

		h3 {
			font-size: 1.6em;
		}

		h2,
		h3,
		h4,
		h5,
		h6 {
			margin-top: 3em;
		}

		h1 + h2 {
			margin-top: 0;
		}
		h2 + h3,
		h3 + h4 {
			margin-top: 1.5em;
		}

		p {
			margin: 0 0 1em;
		}
	}
`;

export default Typography;
