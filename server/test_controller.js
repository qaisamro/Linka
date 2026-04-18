const { getReport } = require('./controllers/universityController');
require('dotenv').config();

const mockReq = {
    query: { limit: 100 },
};

const mockRes = {
    status: (code) => {
        console.log('RES STATUS:', code);
        return mockRes;
    },
    json: (data) => {
        console.log('RES JSON DATA RECEIVED');
        // console.log(JSON.stringify(data, null, 2));
    },
};

async function testController() {
    try {
        await getReport(mockReq, mockRes);
        console.log('Controller execution finished.');
    } catch (err) {
        console.error('CONTROLLER CRASHED:', err.message);
    }
}

testController();
