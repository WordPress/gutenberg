/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import * as WPComponents from '@wordpress/components';

/**
 * External dependencies
 */
import React, { useState, useEffect } from 'react';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';
import githubTheme from 'prism-react-renderer/themes/github';
import styled from '@emotion/styled';

/**
 * Internal dependencies
 */
import Card from '../components/card';

const { Button, ClipboardButton } = WPComponents;

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

		return <ExampleBlock code={ code } />;
	},
} );

function ExampleBlock( props ) {
	const { code } = props;
	const [ exampleCode, setExampleCode ] = useState( code );
	const [ copyText, setCopyText ] = useState( 'Copy' );
	const scope = { ...WPComponents };
	let copyTimeout;

	const isModified = code !== exampleCode;

	useEffect( () => {
		return () => {
			clearTimeout( copyTimeout );
		};
	}, [ copyTimeout ] );

	function handleReset() {
		setExampleCode( code );
	}

	function handleOnCopy() {
		setCopyText( 'Copied!' );
		copyTimeout = setTimeout( () => {
			setCopyText( 'Copy' );
		}, 1500 );
	}

	return (
		<Card>
			<LiveProvider code={ exampleCode } scope={ scope } theme={ githubTheme }>
				<PreviewUI>
					<LivePreview />
				</PreviewUI>
				<EditorUI>
					<EditorActionsUI>
						{ isModified && (
							<Button isDefault isSmall onClick={ handleReset }>
								Reset
							</Button>
						) }
						<ClipboardButton isDefault isSmall text={ exampleCode } onCopy={ handleOnCopy }>
							{ copyText }
						</ClipboardButton>
					</EditorActionsUI>
					<LiveEditor onValueChange={ setExampleCode } />
				</EditorUI>
				<div className="handbook-card__errors">
					<LiveError />
				</div>
			</LiveProvider>
		</Card>
	);
}

const PreviewUI = styled( 'div' )`
	padding: 20px;
	min-height: 100px;
	display: flex;
	align-items: center;
`;

const EditorUI = styled( 'div' )`
	border-top: 1px solid #ddd;
	font-size: 14px;
	position: relative;

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

const EditorActionsUI = styled( 'div' )`
	position: absolute;
	z-index: 2;
	top: 4px;
	right: 4px;
	display: flex;
	align-items: center;

	> * {
		margin-left: 4px;
	}
`;
