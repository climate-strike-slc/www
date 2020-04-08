const chai = require('chai');
const sinonChai = require('sinon-chai');
const sinon = require('sinon');

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
const { ContentTest, PublisherTest } = require('../models'); 
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
  let key, agent, csrf, header = null, users, user, meetings;
  before(async() => {
    // await ContentTest.deleteMany({}).catch(err => console.log(err));
    // await PublisherTest.deleteMany({}).catch(err => console.log(err));
    nock.enableNetConnect('127.0.0.1');
    await app.listen(config.port, () => {
      console.log('connected');
      agent = request.agent(app);
    })
  }, 5000);
  beforeEach(async() => {
    await nockBack.setMode('record');
    await nock.enableNetConnect('127.0.0.1');
  });
  afterEach(async() => {
    // this ensures that consecutive tests don't use the snapshot created
    // by a previous test
    await nockBack.setMode('wild');
    await nock.cleanAll();
    // .expect(302)
    // .expect('Location', '/')
  });
  after(async() => {
    await ContentTest.deleteMany({}).catch(err => console.log(err));
    await PublisherTest.deleteMany({}).catch(err => console.log(err));
    await agent
    .get('/logout')
    .expect(302)
    .expect('Location', '/mtg/jitsi')
  });
  
  key = 'should get a header';
  it(key, async () => {
    const snapKey = ('API calls '+key+' 1');
    const { nockDone } = await nockBack(
      'router.header.json'
    );
    nock.enableNetConnect('127.0.0.1');
    header = (!mockSnapshots ? null : mockSnapshots[snapKey]);
  
    if (!recording) {
      expect(header).to.matchSnapshot();
      nockDone()
  
    } else {
      await agent
      .get('/login')
      .expect(200)
      .then(async(res)=>{
        header = res.header;
        expect(header).to.matchSnapshot();
      })
      nockDone()
    }
  })
  
  key = 'registration page should contain a well-configured csrf token';
  it(key, async() => {
    const snapKey = ('API calls '+key+' 1');
    const { nockDone } = await nockBack(
      'api.csrf.json'
    );
    nock.enableNetConnect('127.0.0.1');
    csrf = (!mockSnapshots ? null : mockSnapshots[snapKey]);
  
    if (!recording) {
      expect(csrf).to.matchSnapshot();
      nockDone()
  
    } else {
  
      await agent
      .get('/register')
      // .expect(200)
      .then(async(res)=>{
        const cookie = res.header['set-cookie'];
        const csf = cookie.filter((item) => {
            // console.log(item, /(XSRF\-TOKEN=)/i.test(item))
            return /(XSRF\-TOKEN=)/.test(item)
          })[0].split('XSRF-TOKEN=')[1].split(';')[0];
        expect(csf).to.matchSnapshot();
  
        await agent
        .post('/register')
        .set('Cookie', cookies(res))
        .send({
          _csrf: csf,
          username: 'tbushman',
          password: 'password',
          email: 'tracey.bushman@gmail.com'
        })
        .expect(302)
        .expect('Location', '/usr/profile')
      })
      nockDone()
  
    }
  }).timeout(5000);
  
  key = 'Should get all users';
  it(key, async () => {
    const snapKey = ('API calls '+key+' 1');
    const { nockDone } = await nockBack(
      'api.users.post.json'
    );
    nock.enableNetConnect('127.0.0.1');
    users = (!mockSnapshots ? null : mockSnapshots[snapKey]);
    
    if (!recording) {
      expect(users).to.matchSnapshot();
      nockDone()

    } else {
      await agent
      .get('/auth')
      .expect(302)
      .expect('Location', '/usr/profile')
      .then(async res => {
        const cookie = res.header['set-cookie'];
        const csf = cookie.filter((item) => {
            return /(XSRF\-TOKEN=)/.test(item)
          })[0].split('XSRF-TOKEN=')[1].split(';')[0];
        if (!csf) throw new Error('missing csrf token');
        await agent
        .post('/login')
        .set('Cookie', cookies(res))
        .send({
          _csrf: csf,
          username: 'tbushman',
          password: 'password'
        })
        .expect(302)
        .expect('Location', '/usr/profile')
        .then(async res => {
          await agent
          .post('/api/users')
          .expect(200)
          // .expect('Location', '/')
          .then(async res => {
            users = res.body;
            expect(res.body.length).to.equal(1);
            expect(res.body).to.matchSnapshot();
            // await agent
            // .get('/sig/admin')
            // // .set('cookie', ck)
            // .expect(302)
            // .expect('Location', `/pu/getgeo/${res[0]._id}`)
            // .then(async res => {
            //   await agent
            //   .post('/')
            // })
          })
        })
        // .catch(err => console.log(err))
        
      })
      // .catch(err => console.log(err))
      // console.log(ck)
      
      nockDone()
      
    }
  })
  
  key = 'should edit a user';
  it(key, async() => {
    const userId = users[0]._id;
    const snapKey = ('API calls '+key+' 1');
    const { nockDone } = await nockBack(
      'usr.profile.post.json'
    );
    nock.enableNetConnect('127.0.0.1');
    user = (!mockSnapshots ? (!users ? null : users[0]) : mockSnapshots[snapKey]);
    
    if (!recording) {
      expect(user).to.matchSnapshot();
      nockDone()

    } else {
      await agent
      .get('/auth')
      .then(async res => {
        await agent
        .get('/usr/profile')
        .expect(200)
        .then(async res => {
          const cookie = res.header['set-cookie'];
          const csf = cookie.filter((item) => {
              return /(XSRF\-TOKEN=)/.test(item)
            })[0].split('XSRF-TOKEN=')[1].split(';')[0];
          if (!csf) throw new Error('missing csrf token');
          await agent
          .post(`/usr/profile/${userId}`)
          .set('Cookie', cookies(res))
          .send({
            _csrf: csf,
            username: 'tb',
            email: 'tbushman@pu.bli.sh'
          })
          .then(async res => {
            await agent
            .post('/api/users')
            .then(async res => {
              user = res.body
              expect(user).to.matchSnapshot()
            })
          })
        })
      })
      
      nockDone()
    }
  })
  
  key = 'should add a meeting with well-configured csrf tokens';
  it(key, async() => {
    const snapKey = ('API calls '+key+' 1');
    const { nockDone } = await nockBack(
      'api.meeting.add.json'
    );
    nock.enableNetConnect('127.0.0.1');
    csrf = (!mockSnapshots ? user : mockSnapshots[snapKey]);
    
    if (!recording) {
      expect(csrf).to.matchSnapshot();
      nockDone()

    } else {
      await agent
      .get('/api/createMeeting')
      .expect(200)
      .then(async res => {
        const cookie = res.header['set-cookie'];
        const csf = cookie.filter((item) => {
            return /(XSRF\-TOKEN=)/.test(item)
          })[0].split('XSRF-TOKEN=')[1].split(';')[0];
        if (!csf) throw new Error('missing csrf token');
        expect(csf).to.matchSnapshot();
        await agent
        .post('/api/createMeeting')
        .set('Cookie', cookies(res))
        .send({
          _csrf: csf,
          topic: 'ecology',
          start_time: moment().utc().format(),
          title: key,
          description: 'API calls '+key+' 1',
          created_at: moment().utc().format(),
          start_url: `https://bli.sh/ecology`
        })
        .expect(302)
        .expect('Location', '/mtg/jitsi')
      })
    }
  })
  
  key = 'should get all meetings';
  it(key, async() => {
    const snapKey = ('API calls '+key+' 1');
    const { nockDone } = await nockBack(
      'mtg.meetings.get.json'
    );
    nock.enableNetConnect('127.0.0.1');
    meetings = (!mockSnapshots ? null : mockSnapshots[snapKey]);
    
    if (!recording) {
      expect(user).to.matchSnapshot();
      nockDone()

    } else {
      await agent
      .post('/mtg/jitsi')
      .expect(200)
      .then(async res => {
        expect(res.body).to.matchSnapshot()
        meetings = res.body;
      })
    }
  })
  
  key = 'should edit a meeting';
  it(key, async() => {
    const snapKey = ('API calls '+key+' 1');
    const { nockDone } = await nockBack(
      'api.meeting.edit.json'
    );
    nock.enableNetConnect('127.0.0.1');
    meeting = (!mockSnapshots ? (!meetings ? null : meetings[0]) : mockSnapshots[snapKey]);
    
    if (!recording) {
      expect(user).to.matchSnapshot();
      nockDone()

    } else {
      await agent
      .get(`/api/editMeeting/${meeting._id}`)
      .expect(200)
      .then(async res => {
        const cookie = res.header['set-cookie'];
        const csf = cookie.filter((item) => {
            return /(XSRF\-TOKEN=)/.test(item)
          })[0].split('XSRF-TOKEN=')[1].split(';')[0];
        if (!csf) throw new Error('missing csrf token');
        await agent
        .post(`/api/editMeeting/${meeting._id}`)
        .set('Cookie', cookies(res))
        .send({
          _csrf: csf,
          topic: 'economy',
          start_time: moment().utc().format(),
          title: key,
          description: 'API calls '+key+' 1',
          created_at: moment().utc().format(),
          start_url: `https://bli.sh/economy`
        })
        .expect(302)
        .expect('Location', '/mtg/jitsi')
        .then(async res => {
          await agent
          .post('/mtg/jitsi')
          .expect(200)
          .then(async res => {
            expect(res.body).to.matchSnapshot()
          })
        })
      })
    }
  })

  key = 'should delete a user';
  it(key, async() => {
    const userId = users[0]._id;
    const snapKey = ('API calls '+key+' 1');
    const { nockDone } = await nockBack(
      'usr.profile.delete.json'
    );
    nock.enableNetConnect('127.0.0.1');
    user = (!mockSnapshots ? user : mockSnapshots[snapKey]);
    
    if (!recording) {
      expect(user).to.matchSnapshot();
      nockDone()

    } else {
      await agent
      .post(`/usr/deleteProfile/${userId}`)
      .expect(200)
      // .expect('Location', '/mtg/jitsi')
      .then(async res => {
        await agent
        .post('/api/users')
        .expect(302)
        .expect('Location', '/login')
        // .then(async res => {
        //   // expect(res.body[0]).to.be.undefined;
        //   expect(res.body).to.matchSnapshot();
        // })
      })
      nockDone()
    }
  })  
})

function cookies (res) {
  return res.headers['set-cookie'].map(function (cookies) {
    return cookies.split(';')[0]
  }).join(';')
}