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

registerBlockType( 'docs/example', {
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

		return (
			<Card>
				<CodeExample code={ code } />
			</Card>
		);
	},
} );
