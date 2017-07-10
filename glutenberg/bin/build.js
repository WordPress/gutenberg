#!/usr/bin/env node
const path = require( 'path' );
const extendsConfig = require( './helpers/extend-webpack-config' );
const usersCwd = process.cwd();

// webpack.config.prod.js checks this.
process.env.NODE_ENV = 'production';

// Load and edit the create-react-app config.
process.chdir( path.resolve( __dirname, '../' ) );
const webpackConfig = require( 'react-scripts/config/webpack.config.prod' );
extendsConfig( webpackConfig, usersCwd );

// Run the build.
require( 'react-scripts/scripts/build' );
