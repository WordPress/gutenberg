# Generic parser comparator

Please understand that this code is generally hacky.
This iteration of the parser comparator focuses on
language-independence while the first iteration was
focused on Javascript being run in a browser.

With this tool we can compare against any parser in
any language in any environment _as long as it can
run provide a web interface_.

That is, there are two parts to this tool:
 - The primary runner which is a simple HTML/JS
   file run in the browser.
 - Parser "runners" which are exposed as web
   services which the browser will call.

## How to use

Load the `index.html` file in your browser and specify
the URLs at which the different parsers can be reached
at. In most cases this will be a local URL as we will
probably be developing the parsers when running this.

Once the two URLs are entered you may click the button
to start. The comparator will download test documents
and then start running its benchmark. There's no _end_
though; it will continue to gather data as long as you
allow it.

To finish press the <kbd>ESC</kbd> key.

## How to develop runner

This was experimentally built using the Calypso project
as a build tool. You may note that at the current time
there are no styles: this is an issue to fix.

In order to run then you will need to perform the
following list of steps:

 1. Clone the [Gutenberg repository](https://github.com/wordpress/gutenberg) and run `npm install`
 2. Clone the [Calypso repository](https://github.com/automattic/wp-calypso) and run `npm install`
 3. Create an `npm link` to Calypso. In its directory run `npm link`
 4. Link to Calypso from this directory. In this directory run `npm link wp-calypso`
 5. Build with `./node_modules/wp-calypso/node_modules/.bin/webpack --mode production`
 6. Run a webserver in this directory, for example `php -S localhost:8000`
 7. Load the `index.html` file

## How to test parsers

There are two Dockerfiles provided for testing Javascript-
and PHP-based parsers. These aren't necessary but are there
to help. The only requirement is mounting a file at `/parser.php`
or `/parser.js` accordingly. Since most parsers will have some
initialization code and need to expose a standard file you
may need to mount additional files.

For example, let's use the provided parsers for the spec parsers.

```
# At first we have to build the docker image
docker build -t php-parser -f runner-php-sync.Dockerfile .

# Run the PHP parser
docker run --rm -it -p 8001:80 -v (pwd)/parser-php-php-pegjs.php:/parser.php -v (pwd)/post.peg.php:/post.peg.php php-parser
```

The defined interface for the PHP runner is that we provide a class
called `MyParser` which has a method called `parse()`. Since we're
using the spec parser from Gutenberg it doesn't provide that interface,
thus we write a small wrapper file that handles that translation. This
wrapper is mounted as `/parser.php` but since it requires the PEG-generated
parser we also mount that at a known location: `/post.peg.php`

The provided Dockerfile creates a web-server that listens to port 80. We
will have multiple parsers running at once so we'll map that port to another
open port - in this case port 8001.

Now the Javascript.

```
# Build the provided docker image
docker build -t js-parser -f runner-js-sync.Dockerfile .

# Run it
docker run --rm -it -p 8002:80 -v (pwd)/parser-js-pegjs.js:/parser.js -v (pwd)/post.peg.js:/post.peg.js js-parser
```

The options here should make sense as well. We created a small wrapper then
setup another port on which to run this.

When running the comparator we will use `localhost:8001` and `localhost:8002`
as the URLs for the parsers.

We should not that Docker was unnecessary. As long as we provide a web service
conforming to the requirements we can run anything and we can skip docker.

## Web interface

In order to normalize runs across all languages, across synchronous vs. asynchronous
code, across all environments, we are connecting via `POST` calls to a web server.
We are also trusting the parser under test to report its own metrics. We're not
looking for people to cheat - we're trying to honestly compare one parser against
another.

The request may contain a `count` parameter indicating how many times to run the
document through the parse function. This can be helpful in order to mitigate
the effects of caches and data locality and other non-obvious factors.

The body of the request should be a raw string which is the content of the document
to be parsed.

The parser should then parse the document and track the time it took to parse it
and do its best to measure the memory used by the parser. Memory can be tricky to
measure; ideally we want the total amount of <abbr>rss</abbr> memory as reported
in `/proc/{pid}` on a Linux system.

The response should mirror this format in a JSON-encoded value:

```
{
	parse: [array of blocks] // parsed output of the document
	us: [number] // number of milliseconds taken to parse the document across all runs
	usAvg: [number] // number of milliseconds on average it took to parse the document once
	rss: {
		start: [number] // bytes of used memory before any initialization
		beforeParserInit: [number] // bytes right before initializing parser
		afterParserInit: [number] // bytes right after initializing parser
		end: [number] // bytes after parsing document the requested number of times
	}
}
```

The comparator will parse this response and report the results accordingly.
