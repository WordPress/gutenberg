/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../validate-package-json';

const ruleTester = new RuleTester( {
	parser: require.resolve( 'jsonc-eslint-parser' ),
} );

ruleTester.run( 'validate-package-json', rule, {
	valid: [
		{
			code: `{
	"name": "@wordpress/test-package",
	"version": "1.0.0",
	"description": "A test package",
	"author": "WordPress Contributors",
	"license": "GPL-2.0-or-later",
	"keywords": [
		"wordpress"
	],
	"homepage": "https://github.com/WordPress/gutenberg",
	"repository": {
		"type": "git",
		"url": "https://github.com/WordPress/gutenberg.git"
	},
	"bugs": {
		"url": "https://github.com/WordPress/gutenberg/issues"
	}
}
`,
			filename: 'package.json',
		},
		{
			code: `{
	"name": "@wordpress/another-package",
	"version": "2.0.0",
	"description": "Another test package",
	"author": "WordPress Contributors",
	"license": "GPL-2.0-or-later",
	"keywords": [
		"gutenberg"
	],
	"homepage": "https://github.com/WordPress/gutenberg",
	"repository": {
		"type": "git",
		"url": "https://github.com/WordPress/gutenberg.git"
	},
	"bugs": {
		"url": "https://github.com/WordPress/gutenberg/issues"
	},
	"dependencies": {
		"alpha": "^1.0.0",
		"beta": "^2.0.0",
		"gamma": "^3.0.0"
	}
}
`,
			filename: 'package.json',
		},
		{
			// With rule overrides - disable valid-values-license
			code: `{
	"name": "@wordpress/test-package",
	"version": "1.0.0",
	"description": "A test package",
	"author": "WordPress Contributors",
	"license": "MIT",
	"keywords": [
		"wordpress"
	],
	"homepage": "https://github.com/WordPress/gutenberg",
	"repository": {
		"type": "git",
		"url": "https://github.com/WordPress/gutenberg.git"
	},
	"bugs": {
		"url": "https://github.com/WordPress/gutenberg/issues"
	}
}
`,
			filename: 'package.json',
			options: [
				{
					rules: {
						'valid-values-license': 'off',
					},
				},
			],
		},
		{
			// With rule overrides - disable require-homepage
			code: `{
	"name": "@wordpress/test-package",
	"version": "1.0.0",
	"description": "A test package",
	"author": "WordPress Contributors",
	"license": "GPL-2.0-or-later",
	"keywords": [
		"wordpress"
	],
	"repository": {
		"type": "git",
		"url": "https://github.com/WordPress/gutenberg.git"
	},
	"bugs": {
		"url": "https://github.com/WordPress/gutenberg/issues"
	}
}
`,
			filename: 'package.json',
			options: [
				{
					rules: {
						'require-homepage': 'off',
					},
				},
			],
		},
	],
	invalid: [
		{
			// Invalid license value - reports error but no autofix available
			code: `{
	"name": "@wordpress/test-package",
	"version": "1.0.0",
	"description": "A test package",
	"author": "WordPress Contributors",
	"license": "MIT",
	"keywords": [
		"wordpress"
	],
	"homepage": "https://github.com/WordPress/gutenberg",
	"repository": {
		"type": "git",
		"url": "https://github.com/WordPress/gutenberg.git"
	},
	"bugs": {
		"url": "https://github.com/WordPress/gutenberg/issues"
	}
}
`,
			filename: 'package.json',
			errors: [
				{
					message:
						'valid-values-license: Invalid value for license. Current value is MIT. Valid values include: GPL-2.0-or-later.',
				},
			],
		},
		{
			// Wrong property order - has autofix
			code: `{
	"version": "1.0.0",
	"name": "@wordpress/test-package",
	"description": "A test package",
	"author": "WordPress Contributors",
	"license": "GPL-2.0-or-later",
	"keywords": [
		"wordpress"
	],
	"homepage": "https://github.com/WordPress/gutenberg",
	"repository": {
		"type": "git",
		"url": "https://github.com/WordPress/gutenberg.git"
	},
	"bugs": {
		"url": "https://github.com/WordPress/gutenberg/issues"
	}
}
`,
			output: `{
	"name": "@wordpress/test-package",
	"version": "1.0.0",
	"description": "A test package",
	"author": "WordPress Contributors",
	"license": "GPL-2.0-or-later",
	"keywords": [
		"wordpress"
	],
	"homepage": "https://github.com/WordPress/gutenberg",
	"repository": {
		"type": "git",
		"url": "https://github.com/WordPress/gutenberg.git"
	},
	"bugs": {
		"url": "https://github.com/WordPress/gutenberg/issues"
	}
}
`,
			filename: 'package.json',
			errors: [
				{
					message:
						'prefer-property-order: Your package.json properties are not in the desired order. Please move "version" after "name".',
				},
			],
		},
		{
			// Unsorted dependencies - has autofix
			code: `{
	"name": "@wordpress/test-package",
	"version": "1.0.0",
	"description": "A test package",
	"author": "WordPress Contributors",
	"license": "GPL-2.0-or-later",
	"keywords": [
		"wordpress"
	],
	"homepage": "https://github.com/WordPress/gutenberg",
	"repository": {
		"type": "git",
		"url": "https://github.com/WordPress/gutenberg.git"
	},
	"bugs": {
		"url": "https://github.com/WordPress/gutenberg/issues"
	},
	"dependencies": {
		"zebra": "^1.0.0",
		"alpha": "^2.0.0",
		"beta": "^3.0.0"
	}
}
`,
			output: `{
	"name": "@wordpress/test-package",
	"version": "1.0.0",
	"description": "A test package",
	"author": "WordPress Contributors",
	"license": "GPL-2.0-or-later",
	"keywords": [
		"wordpress"
	],
	"homepage": "https://github.com/WordPress/gutenberg",
	"repository": {
		"type": "git",
		"url": "https://github.com/WordPress/gutenberg.git"
	},
	"bugs": {
		"url": "https://github.com/WordPress/gutenberg/issues"
	},
	"dependencies": {
		"alpha": "^2.0.0",
		"beta": "^3.0.0",
		"zebra": "^1.0.0"
	}
}
`,
			filename: 'package.json',
			errors: [
				{
					message:
						'prefer-alphabetical-dependencies: Your dependencies are not in alphabetical order. Please move zebra after alpha.',
				},
			],
		},
		{
			// Unsorted devDependencies - has autofix
			code: `{
	"name": "@wordpress/test-package",
	"version": "1.0.0",
	"description": "A test package",
	"author": "WordPress Contributors",
	"license": "GPL-2.0-or-later",
	"keywords": [
		"wordpress"
	],
	"homepage": "https://github.com/WordPress/gutenberg",
	"repository": {
		"type": "git",
		"url": "https://github.com/WordPress/gutenberg.git"
	},
	"bugs": {
		"url": "https://github.com/WordPress/gutenberg/issues"
	},
	"devDependencies": {
		"webpack": "^5.0.0",
		"eslint": "^8.0.0",
		"babel": "^7.0.0"
	}
}
`,
			output: `{
	"name": "@wordpress/test-package",
	"version": "1.0.0",
	"description": "A test package",
	"author": "WordPress Contributors",
	"license": "GPL-2.0-or-later",
	"keywords": [
		"wordpress"
	],
	"homepage": "https://github.com/WordPress/gutenberg",
	"repository": {
		"type": "git",
		"url": "https://github.com/WordPress/gutenberg.git"
	},
	"bugs": {
		"url": "https://github.com/WordPress/gutenberg/issues"
	},
	"devDependencies": {
		"babel": "^7.0.0",
		"eslint": "^8.0.0",
		"webpack": "^5.0.0"
	}
}
`,
			filename: 'package.json',
			errors: [
				{
					message:
						'prefer-alphabetical-devDependencies: Your devDependencies are not in alphabetical order. Please move webpack after babel.',
				},
			],
		},
		{
			// Unsorted peerDependencies - has autofix
			code: `{
	"name": "@wordpress/test-package",
	"version": "1.0.0",
	"description": "A test package",
	"author": "WordPress Contributors",
	"license": "GPL-2.0-or-later",
	"keywords": [
		"wordpress"
	],
	"homepage": "https://github.com/WordPress/gutenberg",
	"repository": {
		"type": "git",
		"url": "https://github.com/WordPress/gutenberg.git"
	},
	"bugs": {
		"url": "https://github.com/WordPress/gutenberg/issues"
	},
	"peerDependencies": {
		"react-dom": "^18.0.0",
		"react": "^18.0.0"
	}
}
`,
			output: `{
	"name": "@wordpress/test-package",
	"version": "1.0.0",
	"description": "A test package",
	"author": "WordPress Contributors",
	"license": "GPL-2.0-or-later",
	"keywords": [
		"wordpress"
	],
	"homepage": "https://github.com/WordPress/gutenberg",
	"repository": {
		"type": "git",
		"url": "https://github.com/WordPress/gutenberg.git"
	},
	"bugs": {
		"url": "https://github.com/WordPress/gutenberg/issues"
	},
	"peerDependencies": {
		"react": "^18.0.0",
		"react-dom": "^18.0.0"
	}
}
`,
			filename: 'package.json',
			errors: [
				{
					message:
						'prefer-alphabetical-peerDependencies: Your peerDependencies are not in alphabetical order. Please move react-dom after react.',
				},
			],
		},
		{
			// Multiple issues - property order + unsorted dependencies
			code: `{
	"version": "1.0.0",
	"name": "@wordpress/test-package",
	"description": "A test package",
	"author": "WordPress Contributors",
	"license": "GPL-2.0-or-later",
	"keywords": [
		"wordpress"
	],
	"homepage": "https://github.com/WordPress/gutenberg",
	"repository": {
		"type": "git",
		"url": "https://github.com/WordPress/gutenberg.git"
	},
	"bugs": {
		"url": "https://github.com/WordPress/gutenberg/issues"
	},
	"dependencies": {
		"zebra": "^1.0.0",
		"alpha": "^2.0.0"
	}
}
`,
			output: `{
	"name": "@wordpress/test-package",
	"version": "1.0.0",
	"description": "A test package",
	"author": "WordPress Contributors",
	"license": "GPL-2.0-or-later",
	"keywords": [
		"wordpress"
	],
	"homepage": "https://github.com/WordPress/gutenberg",
	"repository": {
		"type": "git",
		"url": "https://github.com/WordPress/gutenberg.git"
	},
	"bugs": {
		"url": "https://github.com/WordPress/gutenberg/issues"
	},
	"dependencies": {
		"alpha": "^2.0.0",
		"zebra": "^1.0.0"
	}
}
`,
			filename: 'package.json',
			errors: [
				{
					message:
						'prefer-property-order: Your package.json properties are not in the desired order. Please move "version" after "name".',
				},
				{
					message:
						'prefer-alphabetical-dependencies: Your dependencies are not in alphabetical order. Please move zebra after alpha.',
				},
			],
		},
	],
} );
