/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Time to Read Block Plugin', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activatePlugin( 'time-to-read-block' ),
			requestUtils.deactivatePlugin( 'gutenberg' ),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			await requestUtils.deleteAllPosts(),
			await requestUtils.deactivatePlugin( 'time-to-read-block' ),
			await requestUtils.activatePlugin( 'gutenberg' ),
		] );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost( {
			title: 'Time to Read Block Test',
			content: longerPostContent,
		} );
	} );

	test( 'should display the estimated time to read the post after being inserted', async ( {
		editor,
		page,
	} ) => {
		// Inserting a time to read block.
		await editor.insertBlock( {
			name: 'gutenberg/time-to-read',
		} );

		const timeToReadBlock = editor.canvas.locator(
			'role=document [name="Block: Time to Read"i]'
		);
		await expect( timeToReadBlock ).toBeVisible();
		await expect( timeToReadBlock ).toHaveText( '3 minutes' );

		// Viewing block in the front end.
		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const timeToRead = page.locator( '.wp-block-gutenberg-time-to-read' );
		await expect( timeToRead ).toBeVisible();
		await expect( timeToRead ).toHaveText( '3 minutes' );
	} );
} );

const longerPostContent =
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Pretium vulputate sapien nec sagittis aliquam malesuada bibendum. Imperdiet proin fermentum leo vel orci porta non pulvinar. Commodo viverra maecenas accumsan lacus vel. Neque viverra justo nec ultrices dui sapien eget mi proin. Dictumst quisque sagittis purus sit amet volutpat consequat. Eleifend donec pretium vulputate sapien nec sagittis. Morbi leo urna molestie at elementum eu. Duis convallis convallis tellus id. Vestibulum lorem sed risus ultricies tristique nulla aliquet. Et netus et malesuada fames ac. Sed adipiscing diam donec adipiscing tristique risus nec.\n' +
	'Elit eget gravida cum sociis natoque. Massa tincidunt nunc pulvinar sapien et ligula ullamcorper. Vel pretium lectus quam id leo in vitae turpis. A diam maecenas sed enim ut. At risus viverra adipiscing at in tellus integer. Tristique et egestas quis ipsum suspendisse ultrices gravida dictum. Semper risus in hendrerit gravida rutrum quisque non. Montes nascetur ridiculus mus mauris vitae ultricies. Id neque aliquam vestibulum morbi blandit cursus risus at ultrices. Ligula ullamcorper malesuada proin libero nunc consequat. Sodales ut etiam sit amet nisl purus in. Adipiscing elit duis tristique sollicitudin.\n' +
	'In est ante in nibh mauris cursus mattis molestie a. Adipiscing elit ut aliquam purus sit amet luctus venenatis. Duis convallis convallis tellus id. Pretium quam vulputate dignissim suspendisse in. Elit ullamcorper dignissim cras tincidunt lobortis feugiat vivamus at augue. Tempor orci eu lobortis elementum nibh tellus molestie nunc non. Dui sapien eget mi proin sed libero enim sed. Nec feugiat nisl pretium fusce id velit ut tortor. Viverra suspendisse potenti nullam ac tortor vitae purus faucibus ornare. Sed enim ut sem viverra. In egestas erat imperdiet sed euismod nisi porta lorem. Ut sem nulla pharetra diam sit amet nisl suscipit. Volutpat consequat mauris nunc congue nisi vitae suscipit. Et magnis dis parturient montes nascetur ridiculus mus mauris vitae. Enim nunc faucibus a pellentesque sit. Volutpat lacus laoreet non curabitur gravida arcu ac. Est ante in nibh mauris cursus. Integer eget aliquet nibh praesent tristique magna sit. Tempus quam pellentesque nec nam. Orci phasellus egestas tellus rutrum tellus pellentesque eu.\n' +
	'Amet mauris commodo quis imperdiet. Pharetra massa massa ultricies mi quis hendrerit. Amet nulla facilisi morbi tempus iaculis urna id volutpat. Nunc sed id semper risus in hendrerit gravida rutrum quisque. Nec feugiat in fermentum posuere urna nec tincidunt praesent. Viverra nibh cras pulvinar mattis. At erat pellentesque adipiscing commodo. Parturient montes nascetur ridiculus mus mauris vitae ultricies. Sed vulputate odio ut enim blandit volutpat maecenas volutpat blandit. Sem fringilla ut morbi tincidunt augue interdum velit.\n' +
	'Tellus rutrum tellus pellentesque eu tincidunt tortor. Egestas fringilla phasellus faucibus scelerisque eleifend donec pretium vulputate. Netus et malesuada fames ac. Ac felis donec et odio. Iaculis eu non diam phasellus. Diam donec adipiscing tristique risus. Odio facilisis mauris sit amet massa vitae tortor condimentum. Diam in arcu cursus euismod quis. Condimentum vitae sapien pellentesque habitant morbi tristique senectus et netus. Posuere urna nec tincidunt praesent. Fermentum odio eu feugiat pretium nibh ipsum consequat nisl. Duis ut diam quam nulla porttitor massa. Commodo ullamcorper a lacus vestibulum. Gravida arcu ac tortor dignissim convallis. Aliquam faucibus purus in massa tempor nec feugiat nisl. Vitae tempus quam pellentesque nec.';
