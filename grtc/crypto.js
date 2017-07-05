const forge = require( 'node-forge' );
const rsa = forge.pki.rsa;

const crypto = {
	forge,
	generateKeys: () => {
		return new Promise( ( resolve, reject ) => {
			// generate an RSA key pair asynchronously (uses web workers if available)
			// use workers: -1 to run a fast core estimator to optimize # of workers
			rsa.generateKeyPair( { bits: 1024, workers: 2 }, ( err, keypair ) => {
				if ( err ) {
					return reject( err );
				}

				const newKeys = {
					publicKey: forge.pki.publicKeyToPem( keypair.publicKey ),
					privateKey: forge.pki.privateKeyToPem( keypair.privateKey ),
				};

				resolve( newKeys );
			} );
		} );
	},
	encrypt: ( msg, pubKey ) => {
		return rsa.encrypt( msg, forge.pki.publicKeyFromPem( pubKey ), true );
	},
	decrypt: ( msg, priKey ) => {
		return rsa.decrypt( msg, forge.pki.privateKeyFromPem( priKey ), false, false );
	},
};

export default crypto;
