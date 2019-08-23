/**
 * WordPress dependencies
 */
import * as WPComponents from '@wordpress/components';
import * as WPCompose from '@wordpress/compose';
import * as WPDate from '@wordpress/date';
import * as WPI18n from '@wordpress/i18n';

/**
 * External dependencies
 */
import React, { useState, useEffect } from 'react';
import { LiveProvider, LiveEditor, LiveError, LivePreview, withLive } from 'react-live';
import styled from 'styled-components';

/**
 * Internal dependencies
 */
import CodeSandboxButton from './codesandbox-button';
import theme from '../utils/editor-theme';

const { Button, ClipboardButton } = WPComponents;

const ConnctedCodeSandboxButton = withLive( CodeSandboxButton );

function CodeExample( props ) {
	const { code, enableCodeSandbox, name, transformCode } = props;
	const initialCode = code.replace( / {4}/g, '  ' );

	const [ exampleCode, setExampleCode ] = useState( initialCode );
	const [ copyText, setCopyText ] = useState( 'Copy' );

	let copyTimeout;
	const scope = { ...WPComponents, ...WPCompose, ...WPDate, ...WPI18n };
	const isModified = initialCode !== exampleCode;

	useEffect( () => {
		return () => {
			clearTimeout( copyTimeout );
		};
	}, [ copyTimeout ] );

	function handleReset() {
		setExampleCode( initialCode );
	}

	function handleOnCopy() {
		setCopyText( 'Copied!' );
		copyTimeout = setTimeout( () => {
			setCopyText( 'Copy' );
		}, 1500 );
	}

	return (
		<LiveProvider
			code={ exampleCode }
			scope={ scope }
			theme={ theme }
			transformCode={ transformCode }
		>
			<PreviewUI>
				<LivePreview />
			</PreviewUI>
			<EditorUI style={ { paddingTop: enableCodeSandbox ? '35px' : 0 } }>
				<EditorActionsUI enableCodeSandbox={ enableCodeSandbox }>
					{ enableCodeSandbox && (
						<EditorActionLeftUI>
							<ConnctedCodeSandboxButton name={ name } />
						</EditorActionLeftUI>
					) }

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
	);
}

CodeExample.defaultProps = {
	code: '',
	enableCodeSandbox: false,
	transformCode: ( code ) => code,
};

const PreviewUI = styled.div`
	padding: 30px 20px;
`;

const EditorUI = styled.div`
	background: ${ theme.plain.backgroundColor };
	border-top: 1px solid #ddd;
	border-bottom-left-radius: 4px;
	border-bottom-right-radius: 4px;
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

const EditorActionsUI = styled.div`
	position: absolute;
	z-index: 2;
	top: 4px;
	right: 4px;
	display: flex;
	align-items: center;

	> * {
		margin-left: 4px;
	}

	${ ( { enableCodeSandbox } ) =>
		enableCodeSandbox &&
		`
	left: 4px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.05);
	padding-bottom: 4px;
	border-radius: 0;
	` }
`;

const EditorActionLeftUI = styled.div`
	margin-left: 0;
	margin-right: auto;
`;

export default React.memo( CodeExample );
