/**
 * External dependencies
 */
import axios from 'axios';

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

export async function createRequest( code ) {
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
