const chai = require('chai');
const sinonChai = require('sinon-chai');
const sinon = require('sinon');
const { mockReq, mockRes } = require('sinon-express-mock');

const path = require('path');
const nock = require('nock');
const request = require('supertest');
const http = require('http');
const mockSession = require('mock-session');
const moment = require('moment');
const Mock = require('./utils/mock');
const app = require('../app');
const fs = require('fs');
const config = require('../utils/config/index.js');
const port = config.port;
// const { getAuthCode } = require('../utils/middleware'); 
const { expect } = chai;
chai.use(sinonChai);

const proxyquire = require('proxyquire');
// const httpMocks = require('node-mocks-http');
// const domJSON = require('domjson');
const mockSnapshotsExist = fs.existsSync(
  path.join(__dirname, '.', '__snapshots__', 'index.test.js.snap'));
let mockSnapshots = null;
if (mockSnapshotsExist) {
  mockSnapshots = require(path.join(__dirname, '.', '__snapshots__', 'index.test.js.snap'));
}

const nockBack = nock.back;
nockBack.fixtures = path.join(__dirname, '.', '__nock-fixtures__');

var recording = config.recordenv;
var testing = config.testenv;
console.log(testing, recording);
if (testing === undefined) {
  testing = false;
  recording = false;
}
nockBack.setMode('record');

describe('API calls', () => {
  let key, agent, csrf, header = null;
  before(async() => {
    nock.enableNetConnect('127.0.0.1');
    await app.listen(config.port, () => {
      console.log('connected');
      agent = request.agent(app);
      // authMiddleware = proxyquire('../utils/middleware', {
      //   'path': {}
      // });
      // agent.get('/')
      // .expect(200)
      // console.log(agent)
    })
  }, 5000);
  beforeEach(async() => {
    await nockBack.setMode('record');
    await nock.enableNetConnect('127.0.0.1');
  });
  afterEach(async() => {
    // this ensures that consecutive tests don't use the snapshot created
    // by a previous test
    nockBack.setMode('wild');
    nock.cleanAll();
  });
  after(async() => {
    // await MeetingTest.deleteMany({}).catch(err => console.log(err));
    // console.log('disconnecting');
    // // app.close(); 
    // setImmediate(done);
    // done()
  });
  
  key = 'should get a header';
  it(key, async () => {
    const snapKey = ('API calls '+key+' 1');
    const { nockDone } = await nockBack(
      'editContent.header.json'
    );
    // const { getAuthCode } = authMiddleware;
    nock.enableNetConnect('127.0.0.1');
    header = (!mockSnapshots ? null : mockSnapshots[snapKey]);
  
    if (!recording) {
      expect(header).to.matchSnapshot();
      nockDone()
  
    } else {
      await agent
      .get('/auth')
      // .expect(getAuthCode)
      .expect(302)
      .expect('Location', `https://zoom.us/oauth/authorize?response_type=code&client_id=${config.clientID}&redirect_uri=${config.redirectURL}`)
      .then(async(res)=>{
        header = res.header;
        expect(header).to.matchSnapshot();
      })
    }
  })
  // 
  // key = 'should require authentication redirect';
  // it(key, async() => {
  //   const snapKey = ('API calls '+key+' 1');
  //   const { nockDone } = await nockBack(
  //     'editContent.auth.json'
  //   );
  //   nock.enableNetConnect('127.0.0.1');
  // 
  //   if (!recording) {
  //     expect(header).to.matchSnapshot();
  //     nockDone()
  // 
  //   } else {
  //     // const rq = {
  //     //   headers: header
  //     // };
  //     // const req = mockReq(rq);
  //     // const res = mockRes({ req });
  //     // const next = sinon.spy();
  //     await request(app)
  //     .get('/auth')
  //     .expect(302)
  //     .expect('Location', `https://zoom.us/oauth/authorize?response_type=code&client_id=${config.clientID}&redirect_uri=${config.redirectURL}`)
  //     .then(async(res)=>{
  //       // console.log(res)
  //       nock.enableNetConnect('zoom.us');
  //       await request(app)
  //       .get(`https://zoom.us/oauth/authorize?response_type=code&client_id=${config.clientID}&redirect_uri=${config.redirectURL}`)
  //       .expect(302)
  //       .expect('Location', `${config.redirectURL}`)
  //     })
  //     // .expect(getAuthCode(req, res))
  //     // .end(done)
  // 
  //     // const { getAuthCode } = authMiddleware;
  // 
  //     // getAuthCode(req, res, next)
  //     //   .then((err) => {
  //     //     if (err) console.log(err)
  //     //     expect(next.called).to.equal(true)
  //     //   })
  //   }
  //   // request(app)
  //   // .get('/auth')
  //   // .expect(getAuthCode)
  //   // .end(done)
  //   // agent.get('/api/createMeeting')
  //   // .expect(302)
  //   // .expect('Location', `https://zoom.us/oauth/authorize?response_type=code&client_id=${config.clientID}&redirect_uri=${config.redirectURL}`)
  //   // // .expect(200)
  //   // console.log(agent)
  // 
  // })
  
  key = 'edit page should contain a well-configured csrf token';
  it(key, async(done) => {
    const snapKey = ('API calls '+key+' 1');
    const { nockDone } = await nockBack(
      'editContent.csrf.json'
    );
    nock.enableNetConnect('127.0.0.1');
    csrf = (!mockSnapshots ? null : mockSnapshots[snapKey]);
    
    if (!recording) {
      expect(csrf).to.matchSnapshot();
      nockDone()

    } else {
      
      await agent
      .get('/api/createMeeting')
      // .expect(200)
      // .expect(302)
      // .expect('Location', `https://zoom.us/oauth/authorize?response_type=code&client_id=${config.clientID}&redirect_uri=${config.redirectURL}`)
      .then(async(res)=>{
        // console.log(res.header)
        const csf = res.header['xsrf-token']
        console.log(csf)
        if (!csf) throw new Error('missing csrf token');
        expect(csf).to.matchSnapshot();
        // let cookie = mockSession('slccsSession', process.env.SECRET, {"_csrf":csf});
        await agent
        .post('/api/createMeeting')
        .set('cookie', cookies(res))
        .send({
          _csrf: csf,
          topic: 'ecology',
          start_time: moment().utc().format(),
          title: key,
          description: 'API calls '+key+' 1'
        })
        .expect(302)
        // .end((err, res) => {
        //   if (err) {
        //     console.log(err)
        //   }
        //   console.log('k')
        //   console.log(res)
        //   csrf = csf;
        // })
        // .expect(302)
        // .expect('Location', '/meetings')
        // .then((res) => /*console.log(res)*/
        // {
        // 
        // })
        // .catch((err) => console.log(err))
      })
      nockDone()

    }
  });
    
})

function cookies (res) {
  return res.headers['set-cookie'].map(function (cookies) {
    return cookies.split(';')[0]
  }).join(';')
}

// function promisedRegisterRequest() {
//   var authenticatedagent2b = request.agent(app);
//   return new Promise((resolve, reject) => {
//     authenticatedagent2b
//       .post("/register")
//       .send(user)
//       .end(function(error, response) {
//         if (error) reject(error);
//         resolve(authenticatedagent2b);
//       });
//   });
// }
// // Auxiliary function.
// function createLoginAgent(server, loginDetails, done) {
//   agent
//     .post(server)
//     .send(loginDetails)
//     .end(function (error, response) {
//         if (error) {
//             throw error;
//         }
//         // var loginAgent = request.agent();
//         agent.saveCookies(response);
//         done(loginAgent);
//     });
// };