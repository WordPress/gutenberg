require( 'dotenv' ).config();

// Input capabilities
const capabilities = {
	browserName: 'IE',
	browser_version: '11.0',
	os: 'Windows',
	os_version: '10',
	resolution: '1024x768',
	'browserstack.user': process.env.LOCAL_BROWSERSTACK_USER,
	'browserstack.key': process.env.LOCAL_BROWSERSTACK_KEY,
	name: 'Bstack-[Node] Sample Test',
};

module.exports = {
	capabilities,
};
