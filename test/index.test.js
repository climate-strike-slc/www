const chai = require('chai');
const sinonChai = require('sinon-chai');
const sinon = require('sinon');
const { mockReq, mockRes } = require('sinon-express-mock');

const path = require('path');
const nock = require('nock');
const request = require('supertest');
const http = require('http');
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
    // await agent
    // .get('/logout')
    // .expect(302)
    // .expect('Location', '/')
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
  
  // key = 'should get a header';
  // it(key, async () => {
  //   const snapKey = ('API calls '+key+' 1');
  //   const { nockDone } = await nockBack(
  //     'editContent.header.json'
  //   );
  //   // const { getAuthCode } = authMiddleware;
  //   nock.enableNetConnect('https://zoom.us');
  //   header = (!mockSnapshots ? null : mockSnapshots[snapKey]);
  // 
  //   if (!recording) {
  //     expect(header).to.matchSnapshot();
  //     nockDone()
  // 
  //   } else {
  //     await agent
  //     .get(`https://zoom.us/oauth/authorize?response_type=code&client_id=${config.clientID}&redirect_uri=${config.redirectURL}`)
  //     // .expect(getAuthCode)
  //     .expect(302)
  //     .expect('Location', '/auth')
  //     .then(async(res)=>{
  //       header = res.header;
  //       expect(header).to.matchSnapshot();
  //     })
  //   }
  // })
  // 
  // key = 'should require authentication redirect';
  // it(key, async() => {
  //   const snapKey = ('API calls '+key+' 1');
  //   const { nockDone } = await nockBack(
  //     'editContent.auth.json'
  //   );
  //   nock.enableNetConnect('127.0.0.1');
  //   let header = (!mockSnapshots ? null : mockSnapshots[snapKey]);
  // 
  //   if (!recording) {
  //     expect(header).to.matchSnapshot();
  //     nockDone()
  // 
  //   } else {
  //     await agent
  //     .get('/auth')
  //     .expect(302)
  //     .expect('Location', `https://zoom.us/oauth/authorize?response_type=code&client_id=${config.clientIDTest}&redirect_uri=${config.redirectURLTest}`)
  //     .then(async(res)=>{
  //       // console.log(res)
  //       header = res.header;
  //       expect(header).to.matchSnapshot();
  //       // nock.enableNetConnect('zoom.us');
  //       // await request(app)
  //       // .get(`https://zoom.us/oauth/authorize?response_type=code&client_id=${config.clientIDTest}&redirect_uri=${config.redirectURLTest}`)
  //       // .expect(302)
  //       // .expect('Location', `${config.redirectURL}`)
  //       // .then(async res => {
  //       //   header = res.header;
  //       //   expect(header).to.matchSnapshot();
  //       // })
  //     })
  //   }
  // })
  
  key = 'edit page should contain a well-configured csrf token';
  it(key, async() => {
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
        // const csurf = res.header['xsrf-token']
        // console.log(csf)
        const cookie = res.header['set-cookie'];
        // console.log(res.header)
        // const csf = cookie.filter((item) => {
        //     // console.log(item, /(\_csrf=)/.test(item))
        //     return /(\_csrf=)/.test(item)
        //   })[0].split('_csrf=')[1].split(';')[0];
        
        const csf = cookie.filter((item) => {
          const matches = /(\_csrf=)/i.test(item)
            // console.log(item, /(\_csrf=)/.test(item), matches)
            return matches
          })[0].split('_csrf=')[1].split(';')[0];
        if (!csf) throw new Error('missing csrf token');
        
        // const csf = cookie.filter((item) => {
        //   const matches = /(XSRF\-TOKEN=)/i.test(item) && /\/api\/createMeeting/ig.test(item)
        //     console.log(item, /(XSRF\-TOKEN=)/i.test(item), matches)
        //     return matches
        //   })[0].split('XSRF-TOKEN=')[1].split(';')[0];
        // if (!csf) throw new Error('missing csrf token');
        expect(csf).to.matchSnapshot();
        // console.log(cookies(res), `_csrf=${csf}`)
        await agent
        .post('/api/createMeeting')
        // .set('Cookie', cookies(res, '_csrf'))
        .send({
          _csrf: csf,
          topic: 'ecology',
          start_time: moment().utc().format(),
          title: key,
          description: 'API calls '+key+' 1'
        })
        .expect(302)
        .expect('Location', '/meetings')
        .then(res => {
          console.log(res.header)
        })
        // .expect(403)
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

function cookies (res, cookie) {
  return res.headers['set-cookie'].filter(function (cookies) {
    console.log('cookies')
    console.log(cookies)
    const rx = new RegExp(cookie, 'gi');
    return rx.test(cookies)
    // return cookies.split(';')[0]
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
