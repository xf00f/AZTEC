/* global: describe, after: true */


after('generate coverage report', async () => {
    if (process.env.SOLIDITY_COVERAGE) {
        await global.coverageSubprovider.writeCoverageAsync();
    }
});
