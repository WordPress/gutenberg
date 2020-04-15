const createNewPost = async () => {
	await driver.get( `${ WP_ADMIN_BASE_URL }/post-new.php` );
};

module.exports = {
	createNewPost,
};
