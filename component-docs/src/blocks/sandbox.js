/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';

/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Card from '../components/card';
import CodeExample from '../components/code-example';

function transformCode( code ) {
	if ( ! code ) {
		return '';
	}

	const match = code.replace(
		/import(?:["'\s]*([\w*{}\n, ]+)from\s*)?["'\s]*([@\w/_-]+)["'\s].*/gm,
		''
	);

	return `() => {${ match }; return <Example />}`;
}

registerBlockType( 'docs/sandbox', {
	title: 'Sandbox',
	category: 'layout',
	attributes: {
		code: {
			type: 'string',
			source: 'text',
			selector: 'code',
		},
		name: {
			type: 'string',
		},
	},
	save( props ) {
		const {
			attributes: { code, name },
		} = props;

		return (
			<Card>
				<CodeExample
					name={ name }
					code={ code }
					enableCodeSandbox
					transformCode={ transformCode }
				/>
			</Card>
		);
	},
} );
