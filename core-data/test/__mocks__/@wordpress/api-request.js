const apiRequest = jest.fn();

apiRequest.settings = {
	postTypeRestBaseMapping: {},
	taxonomyRestBaseMapping: {
		category: 'categories',
	},
};

module.exports = apiRequest;
