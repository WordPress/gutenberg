#!/usr/bin/env node

/**
 * External Dependencies
 */
const path = require( 'path' );

/**
 * Internal Dependencies
 */
const extendsConfig = require( './helpers/extend-webpack-config' );

const usersCwd = process.cwd();
const docsFolder = process.argv[ 2 ];

// webpack.config.prod.js checks this.
process.env.NODE_ENV = 'production';

// Load and edit the create-react-app config.
process.chdir( path.resolve( __dirname, '../' ) );
const webpackConfig = require( 'react-scripts/config/webpack.config.prod' );
extendsConfig( webpackConfig, usersCwd, docsFolder );

// Run the build.
require( 'react-scripts/scripts/build' );
