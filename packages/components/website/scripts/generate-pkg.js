const fs = require( 'fs' );
const path = require( 'path' );
const mkdirp = require( 'mkdirp' );

const localDocsDir = path.resolve( __dirname, '../../' );
const localPkg = path.join( localDocsDir, '/package.json' );
const destDir = path.resolve( __dirname, '../src/data' );
const destFile = path.join( destDir, 'pkg.json' );

async function generatePkgData() {
	const pkgFileData = fs.readFileSync( localPkg, 'utf-8' );
	const { name, version, description, homepage, repository, bugs, license, author } = JSON.parse(
		pkgFileData
	);

	const pkg = { name, version, description, homepage, repository, bugs, license, author };
	const pkgFileContent = JSON.stringify( pkg, null, 2 );

	mkdirp.sync( destDir );

	fs.writeFileSync( destFile, pkgFileContent );
}

generatePkgData();
