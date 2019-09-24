/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

/**
 * External dependencies
 */
import React from 'react';
import axios from 'axios';

export default function CodeSandboxButton( props ) {
	const {
		live: { code },
		name,
	} = props;

	const handleOnClick = () => createRequest( { code, name } );

	return (
		<Button isDefault isSmall onClick={ handleOnClick }>
			Edit in Sandbox
		</Button>
	);
}

CodeSandboxButton.defaultProps = {
	live: {},
};

const indexCode = `import React from 'react';
import ReactDOM from 'react-dom';
import Example from './example'
import "@wordpress/components/build-style/style.css";

ReactDOM.render(
  <Example />,
  document.getElementById('root')
);`;
const html = '<div id="root"></div>';

function createExampleCode( code ) {
	return `
import React from 'react';
${ code };

export default Example;
`.trim();
}

function createParameters( { code, name } ) {
	const packageName = name ?
		`wordpress-components-${ name }-example` :
		'wordpress-components-example';
	const parameters = {
		files: {
			'package.json': {
				content: {
					name: packageName,
					dependencies: {
						react: 'latest',
						'react-dom': 'latest',
						'@wordpress/components': 'latest',
						'@wordpress/compose': 'latest',
						'@wordpress/date': 'latest',
						'@wordpress/element': 'latest',
						'@wordpress/i18n': 'latest',
					},
				},
			},
			'index.js': {
				content: indexCode,
			},
			'example.js': {
				content: createExampleCode( code ),
			},
			'index.html': {
				content: html,
			},
		},
	};

	return parameters;
}

async function createRequest( code ) {
	const request = await axios.post(
		'https://codesandbox.io/api/v1/sandboxes/define?json=1',
		createParameters( code )
	);

	if ( request.data ) {
		window.open(
			`https://codesandbox.io/s/${ request.data.sandbox_id }?module=example.js`,
			'_blank'
		);
	}
}
