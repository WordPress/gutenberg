/**
 * Parts of this source were derived and modified from browserless/chrome,
 * released under the GPL-3.0-or-later license.
 *
 * https://github.com/browserless/chrome/blob/master/src/apis/screencast.ts
 */
const path = require( 'path' );
const fs = require( 'fs/promises' );

function getScreencastAPI( downloadName ) {
	class ScreencastAPI {
		constructor() {
			this.canvas = document.createElement( 'canvas' );
			this.downloadAnchor = document.createElement( 'a' );

			document.body.appendChild( this.canvas );
			document.body.appendChild( this.downloadAnchor );

			this.ctx = this.canvas.getContext( '2d' );
			this.downloadAnchor.href = '#';
			this.downloadAnchor.textContent = 'Download video';
			this.downloadAnchor.id = 'download';
			this.chunks = [];
		}

		async beginRecording( stream ) {
			return new Promise( ( resolve, reject ) => {
				this.recorder = new window.MediaRecorder( stream, {
					mimeType: 'video/webm',
				} );
				this.recorder.ondataavailable = ( event ) =>
					this.chunks.push( event.data );
				this.recorder.onerror = reject;
				this.recorder.onstop = resolve;
				this.recorder.start();
			} );
		}

		async download() {
			await this.recordingFinish;
			const blob = new window.Blob( this.chunks, {
				type: 'video/webm',
			} );

			this.downloadAnchor.onclick = () => {
				this.downloadAnchor.href = URL.createObjectURL( blob );
				this.downloadAnchor.download = downloadName;
			};

			this.downloadAnchor.click();
		}

		async start( { width, height } ) {
			this.canvas.width = width;
			this.canvas.height = height;
			this.recordingFinish = this.beginRecording(
				this.canvas.captureStream()
			);
		}

		async draw( pngData ) {
			const data = await window
				.fetch( `data:image/png;base64,${ pngData }` )
				.then( ( res ) => res.blob() )
				.then( ( blob ) => window.createImageBitmap( blob ) );

			this.ctx.clearRect( 0, 0, this.canvas.width, this.canvas.height );
			this.ctx.drawImage( data, 0, 0 );

			return this;
		}

		stop() {
			this.recorder.stop();
			return this;
		}
	}

	return new ScreencastAPI();
}

async function startScreencast( { page, browser, downloadPath, fileName } ) {
	const client = await page.target().createCDPSession();
	const renderer = await browser.newPage();
	const rendererClient = await renderer.target().createCDPSession();
	const downloadName = fileName + '.webm';
	const fullDownloadPath = path.join( downloadPath, downloadName );

	await rendererClient.send( 'Page.setDownloadBehavior', {
		behavior: 'allow',
		downloadPath,
	} );

	const viewport = page.viewport();
	const screencastAPI = await renderer.evaluateHandle(
		getScreencastAPI,
		downloadName
	);
	await page.bringToFront();

	await renderer.evaluate(
		( _screencastAPI, width, height ) =>
			_screencastAPI.start( { width, height } ),
		screencastAPI,
		viewport.width,
		viewport.height
	);

	await client.send( 'Page.startScreencast', {
		format: 'png',
		maxWidth: viewport.width,
		maxHeight: viewport.height,
		everyNthFrame: 1,
	} );

	async function onScreencastFrame( { data, sessionId } ) {
		renderer
			.evaluate(
				( _screencastAPI, _data ) => _screencastAPI.draw( _data ),
				screencastAPI,
				data
			)
			.catch( () => {} );
		client
			.send( 'Page.screencastFrameAck', { sessionId } )
			.catch( () => {} );
	}

	client.on( 'Page.screencastFrame', onScreencastFrame );

	return async function stopScreencast( { save = false } = {} ) {
		await client.send( 'Page.stopScreencast' );
		client.off( 'Page.screencastFrame', onScreencastFrame );
		await renderer.bringToFront();
		await renderer.evaluate(
			async ( _screencastAPI, _save ) => {
				_screencastAPI.stop();
				if ( _save ) {
					await _screencastAPI.download();
				}
			},
			screencastAPI,
			save
		);
		if ( save ) {
			await waitUntilFileDownloaded( fullDownloadPath );
		}
		await renderer.close();
	};
}

async function waitUntilFileDownloaded( filePath ) {
	while ( true ) {
		try {
			await fs.access( filePath );
			break;
		} catch {}

		await new Promise( ( resolve ) => setTimeout( resolve, 500 ) );
	}
}

module.exports = { startScreencast };
