/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import * as WPComponents from '@wordpress/components';

/**
 * External dependencies
 */
import React from 'react';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';
import githubTheme from 'prism-react-renderer/themes/github';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import Card from '../components/card';

registerBlockType( 'handbook/example', {
	title: 'Example: Live',
	category: 'layout',
	attributes: {
		code: {
			type: 'string',
			source: 'text',
			selector: 'code',
		},
	},
	edit() {},
	save( props ) {
		const {
			attributes: { code },
		} = props;
		const scope = { ...WPComponents };

		return (
			<Card>
				<LiveProvider code={ code } scope={ scope } theme={ githubTheme }>
					<PreviewUI>
						<LivePreview />
					</PreviewUI>
					<EditorUI>
						<LiveEditor />
					</EditorUI>
					<div className="handbook-card__errors">
						<LiveError />
					</div>
				</LiveProvider>
			</Card>
		);
	},
} );

export const PreviewUI = styled( 'div' )`
	padding: 20px;
	min-height: 100px;
	display: flex;
	align-items: center;
`;

export const EditorUI = styled( 'div' )`
	border-top: 1px solid #ddd;
	font-size: 14px;

	& > * {
		border-bottom-left-radius: 4px;
		border-bottom-right-radius: 4px;
	}

	& > pre {
		display: block;
		margin: 0;
		padding: 10px;
	}

	textarea {
		&:focus {
			outline: none;
		}
	}
`;
