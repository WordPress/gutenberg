/**
 * External dependencies
 */
import styled from '@emotion/styled';

const Typography = styled( 'div' )`
	color: #444;
	line-height: 1.5;

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
	}

	h1 + p {
		font-size: 1.3em;
	}

	h2 {
		font-size: 2.25em;
		margin-top: 3em;
		font-weight: normal;

		&:first-child {
			margin-top: 0;
		}
	}

	h3 {
		font-size: 1.6em;
	}

	h3,
	h4,
	h5,
	h6 {
		margin-top: 2em;

		&:first-child {
			margin-top: 0;
		}
	}

	p {
		margin: 0 0 1em;
	}

	pre {
		white-space: pre-wrap;
		word-wrap: break-word;

		code {
			padding: 15px;
			display: block;
		}
	}

	code {
		background: rgba(0, 0, 0, 0.05);
		color: black;
		font-size: 14px;
		padding: 2px;
		border-radius: 4px;
	}

	table {
		th {
			text-align: left;
		}

		td {
			padding: 4px 8px 4px 0;
		}
	}
`;

export default Typography;
