<?php
/**
 * Console application, which adds textdomain argument
 * to all i18n function calls
 *
 * @package wordpress-i18n
 */
error_reporting(E_ALL);

require_once dirname( __FILE__ ) . '/makepot.php';

class AddTextdomain {

	var $modified_contents = '';
	var $funcs;

	/**
	 * PHP5 constructor.
	 */
	function __construct() {
		$makepot = new MakePOT;
		$this->funcs = array_keys( $makepot->rules );
	}

	/**
	 * PHP4 constructor.
	 */
	public function AddTextdomain() {
		_deprecated_constructor( 'AddTextdomain' , '4.3'  );
	}

	function usage() {
		$usage = "Usage: php add-textdomain.php [-i] <domain> <file>\n\nAdds the string <domain> as a last argument to all i18n function calls in <file>\nand prints the modified php file on standard output.\n\nOptions:\n    -i    Modifies the PHP file in place, instead of printing it to standard output.\n";
		fwrite(STDERR, $usage);
		exit(1);
	}

	function process_token($token_text, $inplace) {
		if ($inplace)
			$this->modified_contents .= $token_text;
		else
			echo $token_text;
	}


	function process_file($domain, $source_filename, $inplace) {

		$this->modified_contents = '';
		$domain = addslashes($domain);

		$source = file_get_contents($source_filename);
		$tokens = token_get_all($source);

		$in_func = false;
		$args_started = false;
		$parens_balance = 0;
		$found_domain = false;

		foreach($tokens as $token) {
			$string_success = false;
			if (is_array($token)) {
				list($id, $text) = $token;
				if (T_STRING == $id && in_array($text, $this->funcs)) {
					$in_func = true;
					$parens_balance = 0;
					$args_started = false;
					$found_domain = false;
				} elseif (T_CONSTANT_ENCAPSED_STRING == $id && ("'$domain'" == $text || "\"$domain\"" == $text)) {
					if ($in_func && $args_started) {
						$found_domain = true;
					}
				}
				$token = $text;
			} elseif ('(' == $token){
				$args_started = true;
				++$parens_balance;
			} elseif (')' == $token) {
				--$parens_balance;
				if ($in_func && 0 == $parens_balance) {
					$token = $found_domain? ')' : ", '$domain')";
					$in_func = false;
					$args_started = false;
					$found_domain = false;
				}
			}
			$this->process_token($token, $inplace);
		}

		if ($inplace) {
			$f = fopen($source_filename, 'w');
			fwrite($f, $this->modified_contents);
			fclose($f);
		}
	}
}


// run the CLI only if the file
// wasn't included
$included_files = get_included_files();
if ($included_files[0] == __FILE__) {
	$adddomain = new AddTextdomain;

	if (!isset($argv[1]) || !isset($argv[2])) {
		$adddomain->usage();
	}

	$inplace = false;
	if ('-i' == $argv[1]) {
		$inplace = true;
		if (!isset($argv[3])) $adddomain->usage();
		array_shift($argv);	
	}

	$adddomain->process_file($argv[1], $argv[2], $inplace);
}

?>
