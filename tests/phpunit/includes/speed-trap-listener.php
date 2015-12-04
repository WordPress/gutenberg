<?php

/**
 * A PHPUnit TestListener that exposes your slowest running tests by outputting
 * results directly to the console.
 */
class SpeedTrapListener implements PHPUnit_Framework_TestListener
{
    /**
     * Internal tracking for test suites.
     *
     * Increments as more suites are run, then decremented as they finish. All
     * suites have been run when returns to 0.
     *
     * @var integer
     */
    protected $suites = 0;

    /**
     * Time in milliseconds at which a test will be considered "slow" and be
     * reported by this listener.
     *
     * @var int
     */
    protected $slowThreshold;

    /**
     * Number of tests to report on for slowness.
     *
     * @var int
     */
    protected $reportLength;

    /**
     * Collection of slow tests.
     *
     * @var array
     */
    protected $slow = array();

    /**
     * Construct a new instance.
     *
     * @param array $options
     */
    public function __construct(array $options = array())
    {
        $this->loadOptions($options);
    }

    /**
     * An error occurred.
     *
     * @param PHPUnit_Framework_Test $test
     * @param Exception              $e
     * @param float                   $time
     */
    public function addError(PHPUnit_Framework_Test $test, Exception $e, $time)
    {
    }

    /**
     * A warning occurred.
     *
     * @param PHPUnit_Framework_Test    $test
     * @param PHPUnit_Framework_Warning $e
     * @param float                     $time
     * @since Method available since Release 5.1.0
     */
    public function addWarning(PHPUnit_Framework_Test $test, PHPUnit_Framework_Warning $e, $time)
    {
    }

    /**
     * A failure occurred.
     *
     * @param PHPUnit_Framework_Test                 $test
     * @param PHPUnit_Framework_AssertionFailedError $e
     * @param float                                   $time
     */
    public function addFailure(PHPUnit_Framework_Test $test, PHPUnit_Framework_AssertionFailedError $e, $time)
    {
    }

    /**
     * Incomplete test.
     *
     * @param PHPUnit_Framework_Test $test
     * @param Exception              $e
     * @param float                   $time
     */
    public function addIncompleteTest(PHPUnit_Framework_Test $test, Exception $e, $time)
    {
    }

    /**
     * Risky test.
     *
     * @param PHPUnit_Framework_Test $test
     * @param Exception              $e
     * @param float                   $time
     * @since  Method available since Release 4.0.0
     */
    public function addRiskyTest(PHPUnit_Framework_Test $test, Exception $e, $time)
    {
    }

    /**
     * Skipped test.
     *
     * @param PHPUnit_Framework_Test $test
     * @param Exception              $e
     * @param float                   $time
     */
    public function addSkippedTest(PHPUnit_Framework_Test $test, Exception $e, $time)
    {
    }

    /**
     * A test started.
     *
     * @param PHPUnit_Framework_Test $test
     */
    public function startTest(PHPUnit_Framework_Test $test)
    {
    }

    /**
     * A test ended.
     *
     * @param PHPUnit_Framework_Test $test
     * @param float                   $time
     */
    public function endTest(PHPUnit_Framework_Test $test, $time)
    {
        if (!$test instanceof PHPUnit_Framework_TestCase) return;

        $time = $this->toMilliseconds($time);
        $threshold = $this->getSlowThreshold($test);

        if ($this->isSlow($time, $threshold)) {
            $this->addSlowTest($test, $time);
        }
    }

    /**
     * A test suite started.
     *
     * @param PHPUnit_Framework_TestSuite $suite
     */
    public function startTestSuite(PHPUnit_Framework_TestSuite $suite)
    {
        $this->suites++;
    }

    /**
     * A test suite ended.
     *
     * @param PHPUnit_Framework_TestSuite $suite
     */
    public function endTestSuite(PHPUnit_Framework_TestSuite $suite)
    {
        $this->suites--;

        if (0 === $this->suites && $this->hasSlowTests()) {
            arsort($this->slow); // Sort longest running tests to the top

            $this->renderHeader();
            $this->renderBody();
            $this->renderFooter();
        }
    }

    /**
     * Whether the given test execution time is considered slow.
     *
     * @param int $time          Test execution time in milliseconds
     * @param int $slowThreshold Test execution time at which a test should be considered slow (milliseconds)
     * @return bool
     */
    protected function isSlow($time, $slowThreshold)
    {
        return $time >= $slowThreshold;
    }

    /**
     * Stores a test as slow.
     *
     * @param PHPUnit_Framework_TestCase $test
     * @param int                         $time Test execution time in milliseconds
     */
    protected function addSlowTest(PHPUnit_Framework_TestCase $test, $time)
    {
        $label = $this->makeLabel($test);

        $this->slow[$label] = $time;
    }

    /**
     * Whether at least one test has been considered slow.
     *
     * @return bool
     */
    protected function hasSlowTests()
    {
        return !empty($this->slow);
    }

    /**
     * Convert PHPUnit's reported test time (microseconds) to milliseconds.
     *
     * @param float $time
     * @return int
     */
    protected function toMilliseconds($time)
    {
        return (int) round($time * 1000);
    }

    /**
     * Label for describing a test.
     *
     * @param PHPUnit_Framework_TestCase $test
     * @return string
     */
    protected function makeLabel(PHPUnit_Framework_TestCase $test)
    {
        return sprintf('%s:%s', get_class($test), $test->getName());
    }

    /**
     * Calculate number of slow tests to report about.
     *
     * @return int
     */
    protected function getReportLength()
    {
        return min(count($this->slow), $this->reportLength);
    }

    /**
     * Find how many slow tests occurred that won't be shown due to list length.
     *
     * @return int Number of hidden slow tests
     */
    protected function getHiddenCount()
    {
        $total = count($this->slow);
        $showing = $this->getReportLength($this->slow);

        $hidden = 0;
        if ($total > $showing) {
            $hidden = $total - $showing;
        }

        return $hidden;
    }

    /**
     * Renders slow test report header.
     */
    protected function renderHeader()
    {
        echo sprintf("\n\nYou should really fix these slow tests (>%sms)...\n", $this->slowThreshold);
    }

    /**
     * Renders slow test report body.
     */
    protected function renderBody()
    {
        $slowTests = $this->slow;

        $length = $this->getReportLength($slowTests);
        for ($i = 1; $i <= $length; ++$i) {
            $label = key($slowTests);
            $time = array_shift($slowTests);

            echo sprintf(" %s. %sms to run %s\n", $i, $time, $label);
        }
    }

    /**
     * Renders slow test report footer.
     */
    protected function renderFooter()
    {
        if ($hidden = $this->getHiddenCount($this->slow)) {
            echo sprintf("...and there %s %s more above your threshold hidden from view", $hidden == 1 ? 'is' : 'are', $hidden);
        }
    }

    /**
     * Populate options into class internals.
     *
     * @param array $options
     */
    protected function loadOptions(array $options)
    {
        $this->slowThreshold = isset($options['slowThreshold']) ? $options['slowThreshold'] : 500;
        $this->reportLength = isset($options['reportLength']) ? $options['reportLength'] : 10;
    }

    /**
     * Get slow test threshold for given test. A TestCase can override the
     * suite-wide slow threshold by using the annotation @slowThreshold with
     * the threshold value in milliseconds.
     *
     * The following test will only be considered slow when its execution time
     * reaches 5000ms (5 seconds):
     *
     * <code>
     * @slowThreshold 5000
     * public function testLongRunningProcess() {}
     * </code>
     *
     * @param PHPUnit_Framework_TestCase $test
     * @return int
     */
    protected function getSlowThreshold(PHPUnit_Framework_TestCase $test)
    {
        $ann = $test->getAnnotations();

        return isset($ann['method']['slowThreshold'][0]) ? $ann['method']['slowThreshold'][0] : $this->slowThreshold;
    }
}
