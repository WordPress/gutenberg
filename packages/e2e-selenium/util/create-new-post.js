const createNewPost = async () => {
	await driver.get( 'http://localhost:8888/wp-admin/post-new.php' );
};

module.exports = {
	createNewPost,
};
