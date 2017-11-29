const { By, promise, until } = require( 'selenium-webdriver' );

function escapeRegExp( string ) {
	return string.replace( /([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1' );
}

function findElementWithText( context, selector, text ) {
	return context.findElement( ( ctx ) => {
		const buttons = ctx.findElements( By.css( selector ) );
		return promise.filter( buttons, ( button ) => button.getText().then( ( tx ) => tx === text ) );
	} );
}
module.exports.findElementWithText = findElementWithText;

function findBlockByIndex( driver, index ) {
	return driver.findElement( ( ctx ) => {
		return ctx.findElements( By.css( '.editor-block-list__block' ) ).then( ( blocks ) => {
			if ( blocks.length <= 0 ) {
				return Promise.reject( 'No elements satisifying selector ".editor-block-list__block-edit"' );
			}
			if ( index >= 0 ) {
				// indexing from start
				if ( index >= blocks.length ) {
					return Promise.reject( 'Only found ' + blocks.length + ' blocks when ' + ( index + 1 ) + ' were required.' );
				}
				return blocks[ index ];
			}
			// indexing from end with negative indexes
			if ( blocks.length + index < 0 ) {
				return Promise.reject( 'Only found ' + blocks.length + ' blocks when ' + ( -index ) + ' were required.' );
			}
			return blocks[ blocks.length + index ];
		} );
	} );
}
module.exports.findBlockByIndex = findBlockByIndex;

function getPostText( driver ) {
	driver.findElement( By.css( '.editor-ellipsis-menu [aria-label="More"]' ) ).click();
	findElementWithText( driver, '.components-choice-menu button.components-menu-items__toggle', 'Code Editor' ).click();
	const text = driver.findElement( By.css( 'textarea.editor-post-text-editor' ) ).getAttribute( 'value' );
	driver.findElement( By.css( '.editor-ellipsis-menu [aria-label="More"]' ) ).click();
	findElementWithText( driver, '.components-choice-menu button.components-menu-items__toggle', 'Visual Editor' ).click();
	return text;
}
module.exports.getPostText = getPostText;

function visitAdmin( config, driver, adminPath ) {
	const targetUrl = config.baseUrl + '/wp-admin/' + adminPath;
	driver.get( targetUrl );
	// accept the "do you want to leave this page" popup
	driver.wait( until.alertIsPresent(), 10 ).
		then( () => driver.switchTo().alert().accept() ).
		catch( () => { /* ignore error caused by missing popup */ } );
	driver.getCurrentUrl().then( function( url ) {
		if ( url.startsWith( config.baseUrl + '/wp-login.php' ) ) {
			driver.findElement( By.id( 'user_login' ) ).sendKeys( config.username );
			driver.findElement( By.id( 'user_pass' ) ).sendKeys( config.password );
			driver.findElement( By.id( 'wp-submit' ) ).click();
		}
	} );
	driver.wait( until.urlMatches( RegExp( '^' + escapeRegExp( targetUrl ) ) ), 2000 );
}
module.exports.visitAdmin = visitAdmin;

function newPost( config, driver ) {
	visitAdmin( config, driver, 'post-new.php' );
	// let the page render
	driver.wait( until.elementLocated( By.css( 'input.editor-default-block-appender__content, .editor-post-text-editor' ) ), 1000 );
	// if we're in text mode than switch back to visual mode
	driver.findElement( By.css( 'input.editor-default-block-appender__content, .editor-post-text-editor' ) ).
		getTagName().then(
			( tagName ) => {
				if ( tagName.toUpperCase() === 'TEXTAREA' ) {
					// we must select somewhere focusable on the page or the menu click won't register
					driver.findElement( By.css( 'textarea.editor-post-text-editor' ) ).click();
					// click on the menu
					driver.findElement( By.css( '.editor-ellipsis-menu [aria-label="More"]' ) ).click();
					// find the visual mode button and click it
					findElementWithText( driver, '.components-choice-menu button.components-menu-items__toggle', 'Visual Editor' ).click();
					// wait until visual mode has rendered
					driver.wait( until.elementLocated( By.css( 'input.editor-default-block-appender__content' ) ), 1000 );
				}
			} );
}
module.exports.newPost = newPost;

function actionNewPost( config, driver ) {
	return function() {
		// the initial load after server start can be slow so a 5 second timeout is too small
		this.timeout( 10000 );
		newPost( config, driver );
		return driver;
	};
}
module.exports.actionNewPost = actionNewPost;
