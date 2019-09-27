const Platform = {
	OS: 'web',
	select: ( obj ) => ( 'web' in obj ? obj.web : obj.default ),
};

export default Platform;
