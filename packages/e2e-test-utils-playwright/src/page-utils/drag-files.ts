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

type FileObject = {
	name: string;
	mimeType?: string;
	buffer: Buffer;
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

	// Simulate dragging over the document.
	await this.page.dispatchEvent( 'html', 'dragenter', { dataTransfer } );

	const position = {
		x: 0,
		y: 0,
	};

	const getCurrentTopMostElement = async () => {
		const elementFromPosition = await this.page.evaluateHandle(
			( point ) => {
				const element = document.elementFromPoint( point.x, point.y );
				return element;
			},
			position
		);

		return elementFromPosition.asElement();
	};

	return {
		/**
		 * Move the cursor and drag the files to the specified position.
		 *
		 * @param  x The X coordinate.
		 * @param  y The Y coordinate.
		 */
		dragTo: async ( x: number, y: number ) => {
			position.x = x;
			position.y = y;

			const elementHandle = await getCurrentTopMostElement();

			if ( ! elementHandle ) {
				return;
			}

			await elementHandle.dispatchEvent( 'dragenter', { dataTransfer } );
		},
		/**
		 * Drop the files at the current position.
		 */
		drop: async () => {
			const elementHandle = await getCurrentTopMostElement();

			if ( ! elementHandle ) {
				throw new Error(
					`No element at position (${ position.x }, ${ position.y }) to drop on`
				);
			}

			await elementHandle.dispatchEvent( 'drop', { dataTransfer } );
		},
	};
}

export { dragFiles };
