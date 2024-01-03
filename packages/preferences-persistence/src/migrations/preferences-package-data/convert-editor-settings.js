/**
 * Internal dependencies
 */

export default function convertEditorSettings( data ) {
	let newData = data;
	const settingsToMoveToCore = [ 'allowRightClickOverrides' ];

	settingsToMoveToCore.forEach( ( setting ) => {
		if ( data?.[ 'core/edit-post' ]?.[ setting ] !== undefined ) {
			newData = {
				...newData,
				core: {
					...newData?.core,
					[ setting ]: data[ 'core/edit-post' ][ setting ],
				},
			};
			delete newData[ 'core/edit-post' ][ setting ];
		}

		if ( data?.[ 'core/edit-post' ]?.[ setting ] !== undefined ) {
			delete newData[ 'core/edit-site' ][ setting ];
		}
	} );

	if ( Object.keys( newData?.[ 'core/edit-post' ] ?? {} )?.length === 0 ) {
		delete newData[ 'core/edit-post' ];
	}

	if ( Object.keys( newData?.[ 'core/edit-site' ] ?? {} )?.length === 0 ) {
		delete newData[ 'core/edit-site' ];
	}

	return newData;
}
