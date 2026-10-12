"""Applies the steps of blueprint.json to a WordPress install served by
native PHP: runPHP code runs with PHP, writeFile writes the file, with
Playground's /wordpress paths mapped to the install."""
import json
import os
import subprocess
import sys
import tempfile

blueprint, root = sys.argv[1], sys.argv[2]
for step in json.load( open( blueprint ) )[ "steps" ]:
	if step[ "step" ] == "runPHP":
		with tempfile.NamedTemporaryFile( "w", suffix=".php", delete=False ) as script:
			script.write( step[ "code" ].replace( "/wordpress/", root + "/" ) )
		subprocess.run( [ "php", script.name ], check=True )
	elif step[ "step" ] == "writeFile":
		path = step[ "path" ].replace( "/wordpress/", root + "/", 1 )
		os.makedirs( os.path.dirname( path ), exist_ok=True )
		open( path, "w" ).write( step[ "data" ] )
	else:
		sys.exit( "Unsupported blueprint step: " + step[ "step" ] )
