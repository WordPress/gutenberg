import { createRequire } from 'node:module';
import path from 'node:path';
import react from '@vitejs/plugin-react-swc';
import { compileInlineStyle } from '../../../packages/wp-build/lib/compile-inline-style.mjs';

const nodeRequire = createRequire( import.meta.url );
const emotionPlugin = nodeRequire.resolve( '@swc/plugin-emotion' );
const WP_BUILD_CSS_MODULE_STYLE_FIXTURE_ID = 'virtual:wp-build-style-injection';
const WP_BUILD_ORDINARY_STYLE_FIXTURE_ID =
	'virtual:wp-build-ordinary-style-injection';

export async function createVitePlugins( rootDir ) {
	const wpBuildStyleFixtureSources = new Map( [
		[
			WP_BUILD_CSS_MODULE_STYLE_FIXTURE_ID,
			await compileInlineStyle( {
				cssModules: true,
				minify: false,
			} )(
				`@layer wp-build-test {
					.fixture {
						--wp-build-style-injection-test: true;
						color: rgb(1, 2, 3);
					}
				}`,
				rootDir,
				path.join(
					rootDir,
					'test/unit/config/wp-build-style-fixture.module.css'
				)
			),
		],
		[
			WP_BUILD_ORDINARY_STYLE_FIXTURE_ID,
			await compileInlineStyle( { minify: false } )(
				`.ordinary-fixture {
					background-color: rgb(4, 5, 6);
				}`,
				rootDir,
				path.join(
					rootDir,
					'test/unit/config/wp-build-ordinary-style-fixture.css'
				)
			),
		],
	] );

	return [
		{
			name: 'wp-build-style-injection-fixture',
			resolveId( id ) {
				return wpBuildStyleFixtureSources.has( id )
					? `\0${ id }`
					: null;
			},
			load( id ) {
				return id.startsWith( '\0' )
					? wpBuildStyleFixtureSources.get( id.slice( 1 ) ) ?? null
					: null;
			},
		},
		react( {
			plugins: [
				[
					emotionPlugin,
					{
						autoLabel: 'always',
						labelFormat: '[local]',
					},
				],
			],
		} ),
	];
}
