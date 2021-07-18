/**
 * Parts of this source were derived and modified from browserless/chrome,
 * released under the GPL-3.0-or-later license.
 *
 * https://github.com/browserless/chrome/blob/master/src/apis/screencast.ts
 */
const path = require( 'path' );
const fs = require( 'fs/promises' );

function createScreencastClient() {
	class ScreencastClient {
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

		beginRecording( stream ) {
			this.recordingFinish = new Promise( ( resolve, reject ) => {
				this.recorder = new window.MediaRecorder( stream, {
					mimeType: 'video/webm',
				} );
				this.recorder.ondataavailable = ( event ) => {
					this.chunks.push( event.data );
				};
				this.recorder.onerror = reject;
				this.recorder.onstop = resolve;
				this.recorder.start();
			} );
		}

		download( downloadName ) {
			const blob = new window.Blob( this.chunks, {
				type: 'video/webm',
			} );

			const url = URL.createObjectURL( blob );
			this.downloadAnchor.href = url;
			this.downloadAnchor.download = downloadName;

			this.downloadAnchor.click();

			// Revoke the url and free up the memory after download started.
			setTimeout( () => {
				URL.revokeObjectURL( url );
			} );
		}

		start( width, height ) {
			this.chunks = [];
			this.currentFrame = null;
			this.canvas.width = width;
			this.canvas.height = height;
			this.ctx.clearRect( 0, 0, this.canvas.width, this.canvas.height );
			this.beginRecording( this.canvas.captureStream() );
		}

		draw() {
			if ( ! this.currentFrame ) {
				return this;
			}

			this.ctx.clearRect( 0, 0, this.canvas.width, this.canvas.height );
			this.ctx.drawImage( this.currentFrame, 0, 0 );
		}

		setCurrentFrame( pngData ) {
			window
				.fetch( `data:image/png;base64,${ pngData }` )
				.then( ( res ) => res.blob() )
				.then( ( blob ) => window.createImageBitmap( blob ) )
				.then( ( imageBitmap ) => {
					this.currentFrame = imageBitmap;
				} );
		}

		async stop() {
			this.recorder.stop();
			await this.recordingFinish;
		}
	}

	return new ScreencastClient();
}

class Screencast {
	static async setup( page, browser ) {
		const renderer = await browser.newPage();
		const client = await page.target().createCDPSession();
		const rendererClient = await renderer.target().createCDPSession();

		const screencastClient = await renderer.evaluateHandle(
			createScreencastClient
		);
		await page.bringToFront();

		return new Screencast( {
			page,
			renderer,
			client,
			rendererClient,
			screencastClient,
		} );
	}

	constructor( {
		page,
		renderer,
		client,
		rendererClient,
		screencastClient,
	} ) {
		this.page = page;
		this.renderer = renderer;
		this.client = client;
		this.rendererClient = rendererClient;
		this.screencastClient = screencastClient;

		this.intervalId = 0;

		this._onScreencastFrame = this._onScreencastFrame.bind( this );
	}

	async _onScreencastFrame( { data, sessionId } ) {
		this.screencastClient
			.evaluate(
				( screencastClient, _data ) =>
					screencastClient.setCurrentFrame( _data ),
				data
			)
			.catch( () => {} );
		this.client
			.send( 'Page.screencastFrameAck', { sessionId } )
			.catch( () => {} );
	}

	async start() {
		this.client = await this.page.target().createCDPSession();
		const viewport = this.page.viewport();

		await this.screencastClient.evaluate(
			( screencastClient, width, height ) =>
				screencastClient.start( width, height ),
			viewport.width,
			viewport.height
		);

		await this.client.send( 'Page.startScreencast', {
			format: 'png',
			quality: 70,
			maxWidth: viewport.width,
			maxHeight: viewport.height,
			everyNthFrame: 1,
		} );

		/**
		 * MediaRecorder won't push new frames if the canvas didn't update.
		 * To solve this, we manually calling `draw()` for every "frame".
		 * However, the renderer page is in the background and could delay
		 * `requestAnimationFrame`, `setTimeout`, `setInterval` longer than it should be.
		 * We instead schedule the interval on server side to maintain stabler frame rates.
		 * Note that `setInterval` doesn't guarantee stable FPS,
		 * but in our case it's good enough for debugging purpose.
		 */
		this.intervalId = setInterval( () => {
			this.screencastClient
				.evaluate( ( screencastClient ) => screencastClient.draw() )
				.catch( () => {} );
		}, 1000 / 60 ); // 60 FPS

		this.client.on( 'Page.screencastFrame', this._onScreencastFrame );
	}

	async stop( downloadFilePath ) {
		if ( downloadFilePath ) {
			const downloadPath = path.dirname( downloadFilePath );

			await this.rendererClient.send( 'Page.setDownloadBehavior', {
				behavior: 'allow',
				downloadPath,
			} );
		}

		clearInterval( this.intervalId );
		await this.client.send( 'Page.stopScreencast' );
		this.client.off( 'Page.screencastFrame', this._onScreencastFrame );

		await this.screencastClient.evaluate(
			async ( screencastClient, downloadName ) => {
				await screencastClient.stop();
				if ( downloadName ) {
					screencastClient.download( downloadName );
				}
			},
			downloadFilePath && path.basename( downloadFilePath )
		);

		if ( downloadFilePath ) {
			// Wait until the download is finished before closing the page or exiting the tests.
			await waitUntilFileDownloaded( downloadFilePath );
		}
	}

	async teardown() {
		await this.renderer.close();
	}
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

module.exports = Screencast.setup;
