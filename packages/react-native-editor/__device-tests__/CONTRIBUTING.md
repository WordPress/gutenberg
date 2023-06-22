Writing a UI test? Great! 😬 This guide is here to help fill in some of the blanks of how the tests are written now and how you can add a new one.

You can find our on-device UI tests in the `__device-tests__` folder and that's where all of the code for that really lives.  
The test suite follows a sort of [Page Object Pattern](https://webdriver.io/docs/pageobjects.html), the `__device-tests__/pages/editor-page.js` manages all interactions with the pages and the `__device-tests__/gutenberg-editor.test.js` actually uses the functions made available via the Page Object `EditorPage` to drive the test cases. At the time of writing this, all the tests live there but as the suite gets large it might be better to manage different classes of tests in different files.

So what does the process for writing a test look like? Here are some steps that I hope can help make this easier,

### First, define the scenario

-   What are the actions that need to take place here? Walk through the scenario and manually to have an idea of what the test steps will need to do, the elements you'll need to interact with and how you're going to need to interact with them. I found it helps to properly define the steps taken in the scenario and the different user interactions that are needed to accomplish it.

You'd just add a new scenario to the test file as well that would look something like,

```javscript
it( 'should be able to do something', async () => {
	// Code to do something...
} );
```

That first parameter in the block above is where you'd put a short description of the scenario while the next parameter is the code you'd like to execute.

### Second, figure out how to find the elements

-   The UI tests rely on locator strategies to identify elements... There's a number of locator strategies available to use and [this blog post](https://saucelabs.com/resources/blog/advanced-locator-strategies) describes in a little more detail what a few of these are and how to use them. You'll need to start thinking about what locator strategy you'll need to use to find the elements you need if it isn't already available.
-   The preferred strategy is the accessibility identifier and in a lot of cases this might not be possible and you'll have to resort to other less robust alternatives such as XPath.

There's a few tools you have available to figure out what you need.

For Android, you can fire up the app and then within Android Studio select `Tools -> Layout Inspector` which will then open up a `.li` file which you can then use to inspect various areas of the app.

For iOS, you can also fire up and use the accessibility inspector, which is an app that should come available on your OSX machine. From there you can choose the process running your simulator and inspect various areas of the app.

Alternative for both of these platforms and for an interface to simulate the commands I'd recommend [Appium Inspector](https://github.com/appium/appium-inspector/releases). A great tool for inspecting the view hierarchy and interacting with elements on screen as your test would.

Using one or a combination of these tools will make it much easier to identify what locator strategy you're going to use or which elements need accessibility identifiers to ease the search process without affecting VoiceOver features.

### Finally, once you've figured out how you're going to find the elements

-   You'll write any functions needed to interact with the page in the `EditorPage` page object and then call those interactions within the test. The code you'll need to write to actually do the finding will use a combination of

-   Appium's spec https://github.com/appium/appium/blob/1.x/docs/en/about-appium/intro.md which you can find examples of a variety of functions under the commands tab
-   WebDriver I/O Appium protocols https://webdriver.io/docs/api/appium.html which provides examples and descriptions of what those look like.

It takes some getting used to but looking at the existing code should be helpful in identifying common commands that it'd help to be familiar with.
