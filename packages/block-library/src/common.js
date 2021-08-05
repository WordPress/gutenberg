export const toRegisterCoreBlocksByName = ( dependencies = {} ) => {
	const {
		getCoreBlocks = () => [],
		registerCoreBlocks = () => undefined,
	} = dependencies;
	const toUnique = ( value, index, array ) => {
		return array.indexOf( value ) === index;
	};

	return ( names = {}, blocks = getCoreBlocks() ) => {
		const {
			acceptBlocks = [],
			rejectBlocks = [],
			neededBlocks = [ 'core/paragraph' ],
		} = names;
		const accepting = acceptBlocks.length > 0;
		const uniqueAcceptBlocks = acceptBlocks
			.concat( neededBlocks )
			.filter( toUnique );
		const uniqueRejectBlocks = rejectBlocks
			.filter( ( name ) => ! neededBlocks.includes( name ) )
			.filter( toUnique );
		const toNotRejectedBlocks = ( block = {} ) => {
			const { name = '' } = block;
			return ! uniqueRejectBlocks.includes( name );
		};
		const toAcceptedBlocks = ( block = {} ) => {
			const { name = '' } = block;
			return ! accepting || uniqueAcceptBlocks.includes( name );
		};

		return registerCoreBlocks(
			blocks.filter( toNotRejectedBlocks ).filter( toAcceptedBlocks )
		);
	};
};
