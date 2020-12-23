/**
 * External dependencies
 */
import { map } from 'lodash';

export const splitUIClientId = ( uiClientId ) => {
	return [ 'default', uiClientId ];
};

export const dropTreeIdFromBlocks = ( blocks ) => {
	return map( blocks, ( block ) => {
		return {
			...block,
			clientId: splitUIClientId( block.clientId )[ 1 ],
			innerBlocks: dropTreeIdFromBlocks( block.innerBlocks ),
		};
	} );
};

export const dropTreeIdFromClientIds = ( clientIds ) => {
	return map( clientIds, ( clientId ) => {
		return splitUIClientId( clientId )[ 1 ];
	} );
};

export const dropTreeIdFromClientId = ( clientId ) => {
	return clientId ? splitUIClientId( clientId )[ 1 ] : undefined;
};

export const getTreeIdFromUIClientId = ( clientId ) => {
	return clientId ? splitUIClientId( clientId )[ 0 ] : 'default';
};
