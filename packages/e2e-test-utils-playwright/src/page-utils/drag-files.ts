/**
 * External dependencies
 */
import { readFile } from 'fs/promises';
import { basename } from 'path';
import { getType } from 'mime';

/**
 * Internal dependencies
 */
import type { PageUtils } from './index';
import type { Locator } from '@playwright/test';

type FileObject = {
	name: string;
	mimeType?: string;
	buffer: Buffer;
};

type Options = {
	position?: { x: number; y: number };
};

/**
 * Simulate dragging files from outside the current page.
 *
 * @param  this
 * @param  files The files to be dragged.
 * @return The methods of the drag operation.
 */
async function dragFiles(
	this: PageUtils,
	files: string | string[] | FileObject | FileObject[]
) {
	const filesList = Array.isArray( files ) ? files : [ files ];
	const fileObjects = await Promise.all(
		filesList.map( async ( filePathOrObject ) => {
			if ( typeof filePathOrObject !== 'string' ) {
				return {
					name: filePathOrObject.name,
					mimeType:
						filePathOrObject.mimeType ||
						getType( filePathOrObject.name ),
					base64: filePathOrObject.buffer.toString( 'base64' ),
				};
			}
			const base64 = await readFile( filePathOrObject, 'base64' );
			const name = basename( filePathOrObject );
			return {
				name,
				mimeType: getType( filePathOrObject ),
				base64,
			};
		} )
	);

	const dataTransfer = await this.page.evaluateHandle(
		async ( _fileObjects ) => {
			const dt = new DataTransfer();
			const fileInstances = await Promise.all(
				_fileObjects.map( async ( fileObject ) => {
					const blob = await fetch(
						`data:${ fileObject.mimeType };base64,${ fileObject.base64 }`
					).then( ( res ) => res.blob() );
					return new File( [ blob ], fileObject.name, {
						type: fileObject.mimeType ?? undefined,
					} );
				} )
			);

			fileInstances.forEach( ( file ) => {
				dt.items.add( file );
			} );

			return dt;
		},
		fileObjects
	);

	// CDP doesn't actually support dragging files, this is only a _good enough_
	// dummy data so that it will correctly send the relevant events.
	const dragData = {
		items: fileObjects.map( ( fileObject ) => ( {
			mimeType: fileObject.mimeType ?? 'File',
			data: fileObject.base64,
		} ) ),
		files: fileObjects.map( ( fileObject ) => fileObject.name ),
		// Copy = 1, Link = 2, Move = 16.
		dragOperationsMask: 1,
	};

	const cdpSession = await this.context.newCDPSession( this.page );

	const position = {
		x: 0,
		y: 0,
	};

	return {
		/**
		 * Drag the files over an element (fires `dragenter` and `dragover` events).
		 *
		 * @param  selectorOrLocator A selector or a locator to search for an element.
		 * @param  options           The optional options.
		 * @param  options.position  A point to use relative to the top-left corner of element padding box. If not specified, uses some visible point of the element.
		 */
		dragOver: async (
			selectorOrLocator: string | Locator,
			options: Options = {}
		) => {
			const locator =
				typeof selectorOrLocator === 'string'
					? this.page.locator( selectorOrLocator )
					: selectorOrLocator;
			const boundingBox = await locator.boundingBox();

			if ( ! boundingBox ) {
				throw new Error(
					'Cannot find the element or the element is not visible on the viewport.'
				);
			}

			position.x =
				boundingBox.x +
				( options.position?.x ?? boundingBox.width / 2 );
			position.y =
				boundingBox.y +
				( options.position?.y ?? boundingBox.height / 2 );

			await cdpSession.send( 'Input.dispatchDragEvent', {
				type: 'dragEnter',
				...position,
				data: dragData,
			} );
			await cdpSession.send( 'Input.dispatchDragEvent', {
				type: 'dragOver',
				...position,
				data: dragData,
			} );
		},

		/**
		 * Drop the files at the current position.
		 */
		drop: async () => {
			const topMostElement = await this.page.evaluateHandle(
				( { x, y } ) => {
					return document.elementFromPoint( x, y );
				},
				position
			);
			const elementHandle = topMostElement.asElement();

			if ( ! elementHandle ) {
				throw new Error( 'Element not found.' );
			}

			await elementHandle.dispatchEvent( 'drop', { dataTransfer } );

			await cdpSession.detach();
		},
	};
}

export { dragFiles };
